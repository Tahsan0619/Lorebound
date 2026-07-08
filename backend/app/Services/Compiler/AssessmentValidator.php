<?php

namespace App\Services\Compiler;

class AssessmentValidator
{
  /** @var array<int, string> */
    public const TYPES = [
        'scenario',
        'output_prediction',
        'compare',
        'fact_checker',
        'predict_next',
    ];

    /**
     * @return array<int, array<string, mixed>>|null
     */
    public function validateAndSanitize(?array $raw): ?array
    {
        if (! is_array($raw)) {
            return null;
        }

        $items = [];
        $seenTypes = [];

        foreach ($raw as $idx => $row) {
            if (! is_array($row)) {
                continue;
            }
            $type = strtolower(trim((string) ($row['type'] ?? '')));
            if (! in_array($type, self::TYPES, true) || isset($seenTypes[$type])) {
                continue;
            }

            $prompt = trim((string) ($row['prompt'] ?? ''));
            if ($prompt === '') {
                continue;
            }

            $guide = is_array($row['evaluationGuide'] ?? null) ? $row['evaluationGuide'] : [];
            $keyIdeas = array_values(array_filter(array_map(
                static fn ($k) => trim((string) $k),
                (array) ($guide['keyIdeas'] ?? [])
            )));

            if ($keyIdeas === []) {
                continue;
            }

            $seenTypes[$type] = true;
            $items[] = [
                'id' => (string) ($row['id'] ?? 'asmt-'.$type),
                'type' => $type,
                'title' => trim((string) ($row['title'] ?? $this->defaultTitle($type))),
                'prompt' => $prompt,
                'context' => trim((string) ($row['context'] ?? '')),
                'relatedSubtopics' => array_values(array_filter((array) ($row['relatedSubtopics'] ?? []))),
                'sourcePassage' => trim((string) ($row['sourcePassage'] ?? '')),
                'evaluationGuide' => [
                    'keyIdeas' => array_slice($keyIdeas, 0, 6),
                    'fullyCorrect' => trim((string) ($guide['fullyCorrect'] ?? '')),
                    'partiallyCorrect' => trim((string) ($guide['partiallyCorrect'] ?? '')),
                    'incorrect' => trim((string) ($guide['incorrect'] ?? '')),
                ],
            ];
        }

        return count($items) >= 3 ? $items : null;
    }

    private function defaultTitle(string $type): string
    {
        return match ($type) {
            'scenario' => 'Scenario Challenge',
            'output_prediction' => 'Output Prediction',
            'compare' => 'Compare Concepts',
            'fact_checker' => 'Fact Checker',
            'predict_next' => 'Predict the Next',
            default => 'Assessment',
        };
    }
}
