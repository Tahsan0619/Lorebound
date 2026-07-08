<?php

namespace App\Services\Compiler;

use App\Services\Groq\GroqAssessmentPrompt;
use App\Services\Groq\GroqClientService;
use App\Services\Groq\GroqCompilerPrompt;
use App\Services\Groq\GroqLearningGuidePrompt;
use Illuminate\Support\Facades\Log;

class GroqCompilerService
{
    private const MAX_ATTEMPTS = 2;

    public function __construct(
        private GroqClientService $groq,
        private CompilerPayloadValidator $validator,
        private LearningGuideValidator $learningGuideValidator,
        private AssessmentValidator $assessmentValidator,
        private AssessmentBuilderService $assessmentBuilder,
        private SourceChunkRagService $rag,
    ) {}

    /**
     * Two-phase compile: learning guide (notes + subtopics) then game payload.
     *
     * @param  array<string, mixed>  $budget
     * @return array{
     *     category: string,
     *     mechanic_template: string,
     *     structure_type: string,
     *     rationale: string,
     *     confidence_matrix: array<string, int>,
     *     payload: array,
     *     learning_guide: array,
     *     assessments: array,
     *     usage: array<string, int>,
     *     elapsed_seconds: float,
     *     model: string,
     *     models_used: array<int, string>
     * }|null
     */
    public function compile(string $text, string $sourceTitle, ?string $model = null, ?array $budget = null): ?array
    {
        if (! $this->groq->isConfigured()) {
            return null;
        }

        $budget = $budget ?? CompilerTokenBudget::analyze($text);
        $sourceChars = mb_strlen($text);
        $modelsUsed = [];
        $totalUsage = ['prompt_tokens' => 0, 'completion_tokens' => 0, 'total_tokens' => 0];
        $elapsed = 0.0;

        $guideResult = $this->compileLearningGuide($text, $sourceTitle, $model, $budget);
        if ($guideResult === null) {
            return null;
        }

        $modelsUsed = array_merge($modelsUsed, $guideResult['models_used']);
        $totalUsage = $this->mergeUsage($totalUsage, $guideResult['usage']);
        $elapsed += $guideResult['elapsed_seconds'];

        $category = $guideResult['category'];
        $learningGuide = $guideResult['learning_guide'];
        $confidence = $guideResult['confidence'];
        $rationale = $guideResult['rationale'];

        $assessmentResult = $this->compileAssessments(
            $text,
            $sourceTitle,
            $category,
            $learningGuide,
            $model,
            $budget
        );
        if ($assessmentResult !== null) {
            $modelsUsed = array_merge($modelsUsed, $assessmentResult['models_used']);
            $totalUsage = $this->mergeUsage($totalUsage, $assessmentResult['usage']);
            $elapsed += $assessmentResult['elapsed_seconds'];
        }

        $assessments = $assessmentResult['assessments']
            ?? $this->assessmentBuilder->fromSubtopics(
                $sourceTitle,
                $category,
                $learningGuide['subtopics'] ?? [],
                $text
            );

        $gameResult = $this->compileGamePayload(
            $text,
            $sourceTitle,
            $category,
            $model,
            $budget,
            array_map(static fn ($st) => (string) ($st['title'] ?? ''), $learningGuide['subtopics'] ?? [])
        );

        if ($gameResult === null) {
            Log::warning('Groq game payload pass failed after learning guide succeeded');

            return null;
        }

        $modelsUsed = array_values(array_unique(array_merge($modelsUsed, $gameResult['models_used'])));
        $totalUsage = $this->mergeUsage($totalUsage, $gameResult['usage']);
        $elapsed += $gameResult['elapsed_seconds'];

        return [
            'category' => $category,
            'mechanic_template' => $this->mechanicFor($category),
            'structure_type' => $this->structureTypeFor($category),
            'rationale' => $rationale,
            'confidence_matrix' => $confidence,
            'payload' => $gameResult['payload'],
            'theme' => $gameResult['theme'],
            'learning_guide' => $learningGuide,
            'assessments' => $assessments,
            'usage' => $totalUsage,
            'elapsed_seconds' => $elapsed,
            'model' => $gameResult['model'],
            'models_used' => $modelsUsed,
        ];
    }

    /**
     * @param  array<string, mixed>  $budget
     * @return array{category: string, rationale: string, confidence: array<string, int>, learning_guide: array, usage: array<string, int>, elapsed_seconds: float, models_used: array<int, string>}|null
     */
    private function compileLearningGuide(string $text, string $sourceTitle, ?string $model, array $budget): ?array
    {
        $system = GroqLearningGuidePrompt::system($budget);
        $user = GroqLearningGuidePrompt::user($sourceTitle, $text);
        $modelsUsed = [];
        $minSubtopics = (int) ($budget['min_subtopics'] ?? 4);
        $maxSubtopics = (int) ($budget['max_subtopics'] ?? 8);
        $maxExamples = (int) ($budget['max_examples'] ?? 5);

        for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
            $response = $this->groq->chatJson($system, $user, $model, [
                'models' => $this->groq->modelsForRole('decompose'),
                'max_tokens' => (int) $budget['completion_tokens_guide'],
                'temperature' => 0.35,
            ]);

            if ($response === null || empty($response['data'])) {
                continue;
            }

            $modelsUsed[] = (string) $response['model'];
            $data = $response['data'];
            $guide = $this->learningGuideValidator->validateAndSanitize(
                $data['learningGuide'] ?? null,
                $maxSubtopics,
                $minSubtopics,
                $maxExamples
            );

            if ($guide === null) {
                Log::warning('Learning guide validation failed', ['attempt' => $attempt + 1]);

                continue;
            }

            $guide['subtopics'] = $this->rag->attachPassages($text, $guide['subtopics']);
            $category = $this->validator->normalizeCategoryPublic($data['category'] ?? 'Timeline');

            return [
                'category' => $category,
                'rationale' => trim((string) ($data['rationale'] ?? 'Structured learning guide generated from source.')),
                'confidence' => $this->normalizeConfidenceFromData($data['confidence'] ?? [], $category),
                'learning_guide' => $guide,
                'usage' => (array) ($response['usage'] ?? []),
                'elapsed_seconds' => (float) ($response['elapsed_seconds'] ?? 0),
                'models_used' => $modelsUsed,
            ];
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $learningGuide
     * @param  array<string, mixed>  $budget
     * @return array{assessments: array<int, array<string, mixed>>, usage: array<string, int>, elapsed_seconds: float, models_used: array<int, string>}|null
     */
    private function compileAssessments(
        string $text,
        string $sourceTitle,
        string $category,
        array $learningGuide,
        ?string $model,
        array $budget
    ): ?array {
        $system = GroqAssessmentPrompt::system();
        $user = GroqAssessmentPrompt::user(
            $sourceTitle,
            $text,
            $category,
            (array) ($learningGuide['subtopics'] ?? [])
        );
        $modelsUsed = [];

        for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
            $response = $this->groq->chatJson($system, $user, $model, [
                'models' => $this->groq->modelsForRole('generate'),
                'max_tokens' => (int) ($budget['completion_tokens_assessments'] ?? 1600),
                'temperature' => 0.35,
            ]);

            if ($response === null || empty($response['data'])) {
                continue;
            }

            $modelsUsed[] = (string) $response['model'];
            $assessments = $this->assessmentValidator->validateAndSanitize(
                $response['data']['assessments'] ?? null
            );

            if ($assessments === null) {
                continue;
            }

            foreach ($assessments as $i => $row) {
                if (empty($row['sourcePassage'])) {
                    $assessments[$i]['sourcePassage'] = $this->rag->bestPassage(
                        $text,
                        $this->keywordsFromAssessment($row)
                    );
                }
            }

            return [
                'assessments' => $assessments,
                'usage' => (array) ($response['usage'] ?? []),
                'elapsed_seconds' => (float) ($response['elapsed_seconds'] ?? 0),
                'models_used' => $modelsUsed,
            ];
        }

        return null;
    }

    /** @param  array<string, mixed>  $row */
    private function keywordsFromAssessment(array $row): array
    {
        $raw = implode(' ', [
            (string) ($row['prompt'] ?? ''),
            (string) ($row['context'] ?? ''),
            ...((array) ($row['evaluationGuide']['keyIdeas'] ?? [])),
        ]);
        $words = preg_split('/[^a-zA-Z0-9]+/u', strtolower($raw), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return array_values(array_unique(array_filter($words, static fn ($w) => mb_strlen($w) >= 4)));
    }

    /**
     * @param  array<string, mixed>  $budget
     * @param  array<int, string>  $subtopicTitles
     * @return array{payload: array, theme: ?array, usage: array<string, int>, elapsed_seconds: float, model: string, models_used: array<int, string>}|null
     */
    private function compileGamePayload(
        string $text,
        string $sourceTitle,
        string $category,
        ?string $model,
        array $budget,
        array $subtopicTitles
    ): ?array {
        $system = str_replace(
            'Pick the single highest-scoring category as "category". You will ONLY',
            'The category is LOCKED to "'.$category.'". You will ONLY',
            GroqCompilerPrompt::system()
        );

        $user = GroqCompilerPrompt::userForGamePass(
            $sourceTitle,
            $text,
            $category,
            (int) $budget['max_game_items'],
            $subtopicTitles
        );

        $sourceChars = mb_strlen($text);
        $modelsUsed = [];

        for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
            $response = $this->groq->chatJson($system, $user, $model, [
                'models' => $this->groq->modelsForRole('generate'),
                'max_tokens' => (int) $budget['completion_tokens_game'],
                'temperature' => 0.4,
            ]);

            if ($response === null || empty($response['data'])) {
                continue;
            }

            $modelsUsed[] = (string) $response['model'];
            $data = $response['data'];
            $data['category'] = $category;

            $sanitized = $this->validator->validateAndSanitize($data, $sourceChars);
            if ($sanitized === null) {
                $responseRepair = $this->groq->chatJson($system, $user, $model, [
                    'models' => $this->groq->modelsForRole('repair'),
                    'max_tokens' => (int) $budget['completion_tokens_game'],
                    'temperature' => 0.2,
                ]);
                if ($responseRepair !== null && ! empty($responseRepair['data'])) {
                    $modelsUsed[] = (string) $responseRepair['model'];
                    $data = $responseRepair['data'];
                    $data['category'] = $category;
                    $sanitized = $this->validator->validateAndSanitize($data, $sourceChars);
                }
            }

            if ($sanitized === null) {
                continue;
            }

            return [
                'payload' => (array) $sanitized['payload'],
                'theme' => $sanitized['theme'] ?? null,
                'usage' => (array) ($response['usage'] ?? []),
                'elapsed_seconds' => (float) ($response['elapsed_seconds'] ?? 0),
                'model' => (string) $response['model'],
                'models_used' => $modelsUsed,
            ];
        }

        return null;
    }

    /** @param array<string, int> $confidence */
    private function normalizeConfidenceFromData(array $confidence, string $category): array
    {
        $defaults = ['seq' => 15, 'cyc' => 15, 'cau' => 15, 'comp' => 15];
        $merged = array_merge($defaults, array_intersect_key($confidence, $defaults));
        foreach ($merged as $key => $value) {
            $merged[$key] = max(0, min(100, (int) $value));
        }
        $dominantKey = match ($category) {
            'Process' => 'cyc',
            'CauseEffect' => 'cau',
            'Comparison' => 'comp',
            default => 'seq',
        };
        if (($merged[$dominantKey] ?? 0) < 40) {
            $merged[$dominantKey] = 60;
        }

        return $merged;
    }

    /**
     * @param  array<string, int>  $a
     * @param  array<string, int>  $b
     * @return array<string, int>
     */
    private function mergeUsage(array $a, array $b): array
    {
        return [
            'prompt_tokens' => ($a['prompt_tokens'] ?? 0) + ($b['prompt_tokens'] ?? 0),
            'completion_tokens' => ($a['completion_tokens'] ?? 0) + ($b['completion_tokens'] ?? 0),
            'total_tokens' => ($a['total_tokens'] ?? 0) + ($b['total_tokens'] ?? 0),
        ];
    }

    private function mechanicFor(string $category): string
    {
        return match ($category) {
            'Process' => 'Process Loop',
            'CauseEffect' => 'Cause-Effect Chain',
            'Comparison' => 'Comparison Sorter',
            default => 'Timeline Builder',
        };
    }

    private function structureTypeFor(string $category): string
    {
        return match ($category) {
            'Process' => 'Cyclical / Process',
            'CauseEffect' => 'Cause-and-Effect',
            'Comparison' => 'Comparative / Classification',
            default => 'Sequential / Timeline',
        };
    }
}
