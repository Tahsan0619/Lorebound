<?php

namespace App\Services\Compiler;

class LearningGuideValidator
{
    /** @var array<int, string> */
    public const REPRESENTATION_TYPES = [
        'prose', 'bullet', 'numbered', 'table', 'definition_list', 'compare_columns',
        'timeline_strip', 'steps', 'stat_grid', 'formula', 'qa_block', 'highlight',
        'checklist', 'flow', 'cause_chain', 'vocabulary', 'pros_cons', 'hierarchy',
        'quote_callout', 'metric_cards', 'concept_map', 'before_after', 'myth_fact',
        'analogy', 'exam_tip',
    ];

    /**
     * @return array{topicTitle: string, summary: string, keyTakeaways: array<int, string>, subtopics: array<int, array<string, mixed>>}|null
     */
    public function validateAndSanitize(?array $guide, int $maxSubtopics = 25, int $minSubtopics = 3, int $maxExamples = 4): ?array
    {
        if (! is_array($guide)) {
            return null;
        }

        $summary = trim((string) ($guide['summary'] ?? ''));
        if ($summary === '') {
            return null;
        }

        $takeaways = array_values(array_filter(array_map(
            static fn ($t) => trim((string) $t),
            (array) ($guide['keyTakeaways'] ?? [])
        )));

        $rawSubtopics = (array) ($guide['subtopics'] ?? []);
        if ($rawSubtopics === []) {
            return null;
        }

        $subtopics = [];
        $seen = [];
        foreach (array_slice($rawSubtopics, 0, $maxSubtopics) as $idx => $row) {
            if (! is_array($row)) {
                continue;
            }
            $title = trim((string) ($row['title'] ?? ''));
            $explanation = trim((string) ($row['explanation'] ?? ''));
            if ($title === '' || $explanation === '') {
                continue;
            }

            $dedupeKey = strtolower($title).'|'.strtolower(mb_substr($explanation, 0, 120));
            if (isset($seen[$dedupeKey])) {
                continue;
            }
            $seen[$dedupeKey] = true;

            $rep = strtolower(trim((string) ($row['representation'] ?? 'prose')));
            if (! in_array($rep, self::REPRESENTATION_TYPES, true)) {
                $rep = 'prose';
            }

            $examples = array_values(array_filter(array_map(
                static fn ($e) => trim((string) $e),
                (array) ($row['examples'] ?? [])
            )));

            $subtopics[] = [
                'id' => (string) ($row['id'] ?? 'st-'.($idx + 1)),
                'title' => $title,
                'explanation' => $explanation,
                'examples' => array_slice($examples, 0, max(1, $maxExamples)),
                'representation' => $rep,
                'emoji' => (string) ($row['emoji'] ?? '📘'),
                'sourcePassage' => trim((string) ($row['sourcePassage'] ?? '')),
                'table' => is_array($row['table'] ?? null) ? $row['table'] : null,
                'bullets' => array_values(array_filter((array) ($row['bullets'] ?? []))),
                'steps' => array_values(array_filter((array) ($row['steps'] ?? []))),
                'pairs' => is_array($row['pairs'] ?? null) ? $row['pairs'] : null,
            ];
        }

        if (count($subtopics) < max(3, $minSubtopics)) {
            return null;
        }

        $topicTitle = trim((string) ($guide['topicTitle'] ?? ''));

        return [
            'topicTitle' => $topicTitle,
            'summary' => $summary,
            'keyTakeaways' => array_slice($takeaways, 0, 8),
            'subtopics' => $subtopics,
        ];
    }
}
