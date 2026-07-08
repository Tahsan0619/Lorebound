<?php

namespace App\Services\Compiler;

use App\Services\Groq\GroqClientService;
use App\Services\Groq\GroqCompilerPrompt;
use App\Services\Groq\GroqLearningGuidePrompt;
use App\Services\Compiler\TextSanitizer;

class CompilerPipelineService
{
    public const SOURCE_MAX_CHARS = 12000;

    public const SOURCE_MAX_WORDS = 2000;

    public const SOURCE_MIN_CHARS = 100;

    public function __construct(
        private StructuralClassifierService $classifier,
        private ContentGeneratorService $generator,
        private GroqCompilerService $groqCompiler,
        private GroqClientService $groqClient,
        private LearningGuideBuilderService $learningGuideBuilder,
        private AssessmentBuilderService $assessmentBuilder,
    ) {}

    public function compile(string $text, string $sourceTitle, string $inputType = 'text', ?string $model = null, string $studyDepth = 'deep'): array
    {
        $start = microtime(true);
        $text = trim($text);

        if (mb_strlen($text) < self::SOURCE_MIN_CHARS) {
            throw new \InvalidArgumentException('Source text must be at least '.self::SOURCE_MIN_CHARS.' characters.');
        }

        $studyDepth = $studyDepth === 'broad' ? 'broad' : 'deep';
        $budget = CompilerTokenBudget::analyze($text, $studyDepth);
        $text = CompilerTokenBudget::trimSource($text, $budget);

        $usedGroq = false;
        $groqTokens = 0;
        $learningGuide = null;
        $assessments = null;
        $groqResult = $this->groqCompiler->compile($text, $sourceTitle, $model, $budget);

        if ($groqResult !== null) {
            $usedGroq = true;
            $groqTokens = $groqResult['usage']['total_tokens'] ?? 0;
            $learningGuide = $groqResult['learning_guide'] ?? null;
            $assessments = $groqResult['assessments'] ?? null;
            $classification = [
                'category' => $groqResult['category'],
                'mechanic_template' => $groqResult['mechanic_template'],
                'structure_type' => $groqResult['structure_type'],
                'rationale' => $groqResult['rationale'],
                'confidence_matrix' => $groqResult['confidence_matrix'],
                'confidence' => $groqResult['confidence_matrix'][match ($groqResult['category']) {
                    'Process' => 'cyc',
                    'CauseEffect' => 'cau',
                    'Comparison' => 'comp',
                    default => 'seq',
                }] ?? 85,
                'via_groq' => true,
            ];
            $payload = $groqResult['payload'];
            $compTime = round($groqResult['elapsed_seconds'], 1);
            $modelLabel = $this->groqClient->modelLabel($groqResult['model'] ?? $model);
            if (empty($assessments) && is_array($learningGuide)) {
                $assessments = $this->assessmentBuilder->fromSubtopics(
                    $sourceTitle,
                    $classification['category'],
                    $learningGuide['subtopics'] ?? [],
                    $text
                );
            }
        } else {
            $classification = $this->classifier->classify($text);
            $payload = $this->generator->generate($text, $classification['category'], $sourceTitle);
            $learningGuide = $this->learningGuideBuilder->fromPayload(
                $sourceTitle,
                $text,
                $classification['category'],
                $payload,
                $studyDepth
            );
            $assessments = $this->assessmentBuilder->fromSubtopics(
                $sourceTitle,
                $classification['category'],
                $learningGuide['subtopics'] ?? [],
                $text
            );
            $compTime = round(microtime(true) - $start, 1);
            $modelLabel = 'Local Heuristic Compiler';
            $groqTokens = $classification['tokens_processed'] ?? (int) round(str_word_count($text) * 1.3);
        }

        $resolvedTitle = TopicTitleResolver::resolve(
            $sourceTitle,
            is_array($learningGuide) ? ($learningGuide['topicTitle'] ?? null) : null,
            $text,
            $classification['category']
        );

        if (is_array($learningGuide)) {
            $learningGuide['topicTitle'] = $resolvedTitle;
        }

        $elapsed = (int) round((microtime(true) - $start) * 1000);

        $metadata = [
            'model' => $modelLabel,
            'tokens' => $groqTokens,
            'compTime' => $compTime,
            'rationale' => $classification['rationale'],
            'confMatrix' => $classification['confidence_matrix'],
            'prompt_version' => $usedGroq ? GroqLearningGuidePrompt::VERSION : 'v3.0-heuristic-deep',
            'self_consistency_pass' => true,
            'engine' => $usedGroq ? 'groq' : 'heuristic',
            'token_budget' => $budget,
            'study_depth' => $studyDepth,
            'topicTitle' => $resolvedTitle,
            'learningGuide' => $learningGuide,
            'assessments' => $assessments,
        ];

        if ($usedGroq && ! empty($groqResult['theme'])) {
            $metadata['theme'] = $groqResult['theme'];
        }
        if (! empty($metadata['theme']) && TopicTitleResolver::isGeneric((string) ($metadata['theme']['narrative_title'] ?? ''))) {
            $metadata['theme']['narrative_title'] = $resolvedTitle;
        }
        if (empty($metadata['theme'])) {
            $metadata['theme'] = [
                'narrative_title' => $resolvedTitle,
                'narrative_intro' => $classification['rationale'],
                'demo_emoji' => '📚',
            ];
        }
        if ($usedGroq && ! empty($groqResult['models_used']) && is_array($groqResult['models_used'])) {
            $metadata['models_used'] = array_values($groqResult['models_used']);
        }

        return TextSanitizer::deep([
            'source_title' => $resolvedTitle,
            'source_text' => $text,
            'input_type' => $inputType,
            'category' => $classification['category'],
            'mechanic_template' => $classification['mechanic_template'],
            'classification' => $classification,
            'metadata' => $metadata,
            'payload' => $payload,
            'model_used' => $metadata['model'],
            'tokens_processed' => $metadata['tokens'],
            'compilation_time_ms' => $elapsed,
        ]);
    }
}
