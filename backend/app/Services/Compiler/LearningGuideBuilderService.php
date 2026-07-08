<?php

namespace App\Services\Compiler;

/**
 * Builds a learning guide from game payload when Groq is unavailable.
 */
class LearningGuideBuilderService
{
    public function __construct(private SourceChunkRagService $rag) {}

    /**
     * @return array{summary: string, keyTakeaways: array<int, string>, subtopics: array<int, array<string, mixed>>}
     */
    public function fromPayload(string $title, string $sourceText, string $category, array $payload, string $studyDepth = 'deep'): array
    {
        $budget = CompilerTokenBudget::applyStudyDepth(CompilerTokenBudget::analyze($sourceText, $studyDepth), $studyDepth);
        $maxItems = (int) $budget['max_subtopics'];

        $resolvedTitle = TopicTitleResolver::resolve($title, null, $sourceText, $category);
        $items = $this->extractItems($category, $payload);
        $subtopics = [];
        foreach (array_slice($items, 0, $maxItems) as $idx => $item) {
            $subtopics[] = [
                'id' => (string) ($item['id'] ?? 'st-'.($idx + 1)),
                'title' => (string) ($item['title'] ?? 'Concept '.($idx + 1)),
                'explanation' => (string) ($item['body'] ?? $item['desc'] ?? ''),
                'examples' => array_filter([(string) ($item['subtitle'] ?? '')]),
                'representation' => $this->inferRepresentation($category, $item),
                'emoji' => (string) ($item['emoji'] ?? '📘'),
                'sourcePassage' => (string) ($item['sourcePassage'] ?? ''),
                'table' => $item['table'] ?? null,
                'bullets' => $item['bullets'] ?? [],
                'steps' => $item['steps'] ?? [],
                'pairs' => $item['pairs'] ?? null,
            ];
        }

        $subtopics = $this->rag->attachPassages($sourceText, $subtopics);

        return [
            'topicTitle' => $resolvedTitle,
            'summary' => "Study guide for {$resolvedTitle}. Read each subtopic below, then complete depth checks before the challenge game.",
            'keyTakeaways' => array_slice(array_map(static fn ($st) => $st['title'], $subtopics), 0, 6),
            'subtopics' => $subtopics,
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function extractItems(string $category, array $payload): array
    {
        $items = [];
        if ($category === 'Timeline') {
            foreach ($payload['levels'] ?? [] as $lvl) {
                foreach ($lvl['events'] ?? [] as $e) {
                    $items[] = [
                        'id' => $e['id'] ?? null,
                        'title' => $e['title'] ?? '',
                        'subtitle' => $e['date'] ?? '',
                        'body' => $e['desc'] ?? '',
                        'sourcePassage' => $e['sourcePassage'] ?? '',
                        'emoji' => $e['emoji'] ?? '📅',
                        'representation' => 'timeline_strip',
                    ];
                }
            }
        } elseif ($category === 'Process') {
            foreach ($payload['phases'] ?? [] as $ph) {
                foreach ($ph['stages'] ?? [] as $s) {
                    $items[] = [
                        'id' => $s['id'] ?? null,
                        'title' => $s['title'] ?? '',
                        'subtitle' => $ph['name'] ?? '',
                        'body' => $s['desc'] ?? '',
                        'sourcePassage' => $s['sourcePassage'] ?? '',
                        'emoji' => '⚙️',
                        'representation' => 'steps',
                        'steps' => [$s['title'] ?? ''],
                    ];
                }
            }
        } elseif ($category === 'CauseEffect') {
            foreach ($payload['levels'] ?? [] as $lvl) {
                foreach ($lvl['chains'] ?? [] as $c) {
                    $items[] = [
                        'id' => $c['id'] ?? null,
                        'title' => $c['cause'] ?? '',
                        'subtitle' => $c['effect'] ?? '',
                        'body' => $c['rationale'] ?? '',
                        'sourcePassage' => $c['sourcePassage'] ?? '',
                        'emoji' => '🔗',
                        'representation' => 'cause_chain',
                        'pairs' => [['left' => $c['cause'] ?? '', 'right' => $c['effect'] ?? '']],
                    ];
                }
            }
        } else {
            foreach ($payload['cards'] ?? [] as $c) {
                $items[] = [
                    'id' => $c['id'] ?? null,
                    'title' => $c['text'] ?? '',
                    'subtitle' => $c['category'] ?? '',
                    'body' => $c['rationale'] ?? '',
                    'sourcePassage' => $c['sourcePassage'] ?? '',
                    'emoji' => $c['emoji'] ?? '🃏',
                    'representation' => 'compare_columns',
                ];
            }
        }

        return $items;
    }

    /** @param array<string, mixed> $item */
    private function inferRepresentation(string $category, array $item): string
    {
        if (! empty($item['representation'])) {
            return (string) $item['representation'];
        }

        return match ($category) {
            'Process' => 'steps',
            'CauseEffect' => 'cause_chain',
            'Comparison' => 'compare_columns',
            default => 'timeline_strip',
        };
    }
}
