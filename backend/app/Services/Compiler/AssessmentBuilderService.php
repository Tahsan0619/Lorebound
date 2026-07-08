<?php

namespace App\Services\Compiler;

/**
 * Heuristic fallback assessments when Groq assessment pass is unavailable.
 */
class AssessmentBuilderService
{
    /**
     * @param  array<int, array<string, mixed>>  $subtopics
     * @return array<int, array<string, mixed>>
     */
    public function fromSubtopics(string $title, string $category, array $subtopics, string $sourceText): array
    {
        $st = array_values($subtopics);
        $a = fn (int $i) => $st[$i % max(1, count($st))] ?? ['id' => 'st-1', 'title' => $title, 'explanation' => '', 'sourcePassage' => mb_substr($sourceText, 0, 120)];

        $types = AssessmentValidator::TYPES;
        $out = [];

        foreach ($types as $i => $type) {
            $sub = $a($i);
            $out[] = [
                'id' => 'asmt-'.$type,
                'type' => $type,
                'title' => $this->titleFor($type),
                'prompt' => $this->promptFor($type, $sub, $a($i + 1), $category),
                'context' => $type === 'scenario' ? 'Apply what you studied to a realistic situation.' : '',
                'relatedSubtopics' => [(string) ($sub['id'] ?? 'st-1')],
                'sourcePassage' => (string) ($sub['sourcePassage'] ?? mb_substr($sourceText, 0, 100)),
                'evaluationGuide' => [
                    'keyIdeas' => array_values(array_filter([
                        (string) ($sub['title'] ?? ''),
                        ...array_slice(preg_split('/[.?!]/', (string) ($sub['explanation'] ?? '')) ?: [], 0, 3),
                    ])),
                    'fullyCorrect' => trim((string) ($sub['explanation'] ?? '')) !== ''
                        ? (string) $sub['explanation']
                        : ((string) ($sub['sourcePassage'] ?? '') ?: 'Explain the source mechanism clearly with evidence.'),
                    'partiallyCorrect' => 'Touches the topic but misses mechanism, causal link, or source evidence.',
                    'incorrect' => 'Contradicts the source, confuses unrelated ideas, or lacks usable reasoning.',
                ],
            ];
        }

        return $out;
    }

    private function titleFor(string $type): string
    {
        return match ($type) {
            'scenario' => 'Scenario Based Question',
            'output_prediction' => 'Output Prediction',
            'compare' => 'Compare Two Concepts',
            'fact_checker' => 'Fact Checker',
            'predict_next' => 'Predict the Next',
            default => 'Assessment',
        };
    }

    /**
     * @param  array<string, mixed>  $a
     * @param  array<string, mixed>  $b
     */
    private function promptFor(string $type, array $a, array $b, string $category): string
    {
        $ta = (string) ($a['title'] ?? 'Concept A');
        $tb = (string) ($b['title'] ?? 'Concept B');

        return match ($type) {
            'scenario' => "Imagine a real classroom or workplace situation involving \"{$ta}\". In your own words, explain what would happen and why, using evidence from the source material.",
            'output_prediction' => "If the process stage \"{$ta}\" completed successfully, what output or state would you expect next? Explain your prediction step by step.",
            'compare' => "Compare \"{$ta}\" and \"{$tb}\". How are they similar and how do they differ according to the source?",
            'fact_checker' => "Evaluate this claim: \"{$ta} is unrelated to {$tb}.\" Is it true, false, or partially true? Explain with evidence from the source.",
            'predict_next' => "Given what you learned about \"{$ta}\", what is the most likely next step or consequence in this {$category} structure? Justify your answer.",
            default => "Explain \"{$ta}\" in depth using the source material.",
        };
    }
}
