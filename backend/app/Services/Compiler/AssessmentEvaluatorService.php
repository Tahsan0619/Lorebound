<?php

namespace App\Services\Compiler;

use App\Services\Compiler\TextSanitizer;
use App\Services\Groq\GroqAssessmentPrompt;

class AssessmentEvaluatorService
{
    public function __construct(private GroqClientService $groq) {}

    /**
     * @param  array<string, mixed>  $assessment
     * @return array<string, mixed>|null
     */
    public function evaluate(
        array $assessment,
        string $userAnswer,
        string $sourceText,
        ?string $model = null
    ): ?array {
        if (! $this->groq->isConfigured()) {
            return $this->heuristicEvaluate($assessment, $userAnswer);
        }

        $system = <<<'PROMPT'
You are a Lorebound learning coach. Output JSON only. NEVER give numeric scores or letter grades.

Evaluate the student's written answer against the source material and evaluation guide.

Return:
{
  "interpretation": "You approached this as: ... (mirror their reasoning respectfully)",
  "truthLevel": "fully_true|partially_true|fully_false",
  "partialPercent": 0-100,
  "whatIsTrue": "what parts align with the source (empty if none)",
  "whatIsFalse": "what parts contradict or miss the source",
  "fullExplanation": "clear teaching explanation grounded in the source",
  "sourceGrounding": "short quote or paraphrase from source"
}

RULES:
- If even 5-10% is correct, use partially_true and explain BOTH the small truth AND why the rest fails.
- If fully false, say clearly the idea is fully false, then teach the correct concept.
- If fully true, affirm specifically what they got right, then deepen with one extra insight.
- No shaming. No "wrong!" or percentages shown as grades.
- NEVER use em-dashes (—) or en-dashes (–). Use commas, periods, or colons instead.
PROMPT;

        $guide = $assessment['evaluationGuide'] ?? [];
        $user = json_encode([
            'assessment' => [
                'type' => $assessment['type'] ?? '',
                'prompt' => $assessment['prompt'] ?? '',
                'context' => $assessment['context'] ?? '',
                'sourcePassage' => $assessment['sourcePassage'] ?? '',
                'evaluationGuide' => $guide,
            ],
            'studentAnswer' => $userAnswer,
            'sourceExcerpt' => mb_substr($sourceText, 0, 2500),
        ], JSON_UNESCAPED_UNICODE);

        $response = $this->groq->chatJson($system, $user, $model, [
            'models' => $this->groq->modelsForRole('decompose'),
            'max_tokens' => 900,
            'temperature' => 0.25,
        ]);

        if ($response === null || empty($response['data'])) {
            return $this->heuristicEvaluate($assessment, $userAnswer);
        }

        $data = $response['data'];
        $level = (string) ($data['truthLevel'] ?? 'partially_true');

        return TextSanitizer::deep([
            'interpretation' => trim((string) ($data['interpretation'] ?? 'Let us review your reasoning.')),
            'truthLevel' => in_array($level, ['fully_true', 'partially_true', 'fully_false'], true) ? $level : 'partially_true',
            'partialPercent' => max(0, min(100, (int) ($data['partialPercent'] ?? 0))),
            'whatIsTrue' => trim((string) ($data['whatIsTrue'] ?? '')),
            'whatIsFalse' => trim((string) ($data['whatIsFalse'] ?? '')),
            'fullExplanation' => trim((string) ($data['fullExplanation'] ?? '')),
            'sourceGrounding' => trim((string) ($data['sourceGrounding'] ?? '')),
        ]);
    }

    /**
     * @param  array<string, mixed>  $assessment
     * @return array<string, mixed>
     */
    private function heuristicEvaluate(array $assessment, string $userAnswer): array
    {
        $answer = strtolower(trim($userAnswer));
        $keyIdeas = array_map('strtolower', (array) ($assessment['evaluationGuide']['keyIdeas'] ?? []));
        $hits = 0;
        foreach ($keyIdeas as $idea) {
            if ($idea !== '' && str_contains($answer, strtolower($idea))) {
                $hits++;
            }
        }
        $ratio = $keyIdeas === [] ? 0 : $hits / count($keyIdeas);
        $level = $ratio >= 0.7 ? 'fully_true' : ($ratio >= 0.15 ? 'partially_true' : 'fully_false');
        $pct = (int) round($ratio * 100);

        $guide = $assessment['evaluationGuide'] ?? [];

        return TextSanitizer::deep([
            'interpretation' => 'You approached this as: '.$userAnswer,
            'truthLevel' => $level,
            'partialPercent' => $pct,
            'whatIsTrue' => $level !== 'fully_false' ? ($guide['partiallyCorrect'] ?? 'Some alignment with key ideas.') : '',
            'whatIsFalse' => $level !== 'fully_true' ? ($guide['incorrect'] ?? 'Parts of the answer miss the source material.') : '',
            'fullExplanation' => $guide['fullyCorrect'] ?? (string) ($assessment['sourcePassage'] ?? ''),
            'sourceGrounding' => (string) ($assessment['sourcePassage'] ?? ''),
        ]);
    }
}
