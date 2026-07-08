<?php

namespace App\Services\Compiler;

class ContentGeneratorService
{
    public function generate(string $text, string $category, string $title = 'Topic'): array
    {
        $sentences = preg_split('/(?<=[.!?])\s+/', trim($text), -1, PREG_SPLIT_NO_EMPTY) ?: [$text];

        return match ($category) {
            'Timeline' => $this->timelinePayload($sentences),
            'Process' => $this->processPayload($sentences),
            'CauseEffect' => $this->causeEffectPayload($sentences),
            default => $this->comparisonPayload($sentences, $title),
        };
    }

    private function timelinePayload(array $sentences): array
    {
        $events = [];
        $order = 0;

        foreach ($sentences as $sentence) {
            if ($order >= 18) {
                break;
            }
            if (preg_match('/\b(19\d{2}|20\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i', $sentence, $m)) {
                $events[] = [
                    'id' => 'evt-'.$order,
                    'title' => $this->truncateAtWord(trim($sentence), 72),
                    'date' => $m[0],
                    'desc' => trim($sentence),
                    'order' => $order,
                    'sourcePassage' => trim($sentence),
                ];
                $order++;
            }
        }

        while (count($events) < 12) {
            $idx = min(count($events), count($sentences) - 1);
            $s = $sentences[$idx] ?? 'Additional curriculum event.';
            $events[] = [
                'id' => 'evt-'.count($events),
                'title' => $this->truncateAtWord(trim($s), 72),
                'date' => 'Stage '.(count($events) + 1),
                'desc' => trim($s),
                'order' => count($events),
                'sourcePassage' => trim($s),
            ];
        }

        $chunk = (int) ceil(count($events) / 3);
        $levels = [];
        foreach (array_chunk($events, $chunk) as $li => $chunkEvents) {
            $levels[] = [
                'name' => 'Era '.($li + 1).': Key Milestones',
                'events' => array_values(array_map(fn ($e, $i) => [...$e, 'order' => $i], $chunkEvents, array_keys($chunkEvents))),
            ];
        }

        return ['levels' => $levels];
    }

    private function processPayload(array $sentences): array
    {
        $stages = [];
        $limit = min(count($sentences), 12);

        for ($i = 0; $i < $limit; $i++) {
            $s = trim($sentences[$i]);
            $hash = crc32($s);
            $target = 35 + ($hash % 35);
            $stages[] = [
                'id' => 'stg-'.$i,
                'title' => 'Stage '.($i + 1),
                'desc' => $s,
                'question' => 'What occurs during Stage '.($i + 1).' of this process?',
                'options' => [
                    $this->truncateAtWord($s, 80),
                    'Alternative systemic pathway with reversed flow',
                    'Incorrect loop transition at prior stage',
                    'Non-cyclic distractor unrelated to source',
                ],
                'correctIndex' => 0,
                'rationale' => 'Extracted from source curriculum text.',
                'sourcePassage' => $s,
                'simParams' => [
                    'label' => 'System Intensity',
                    'targetMin' => max(20, $target - 8),
                    'targetMax' => min(90, $target + 8),
                ],
            ];
        }

        while (count($stages) < 8) {
            $s = trim($sentences[min(count($stages), count($sentences) - 1)]);
            $stages[] = [
                'id' => 'stg-'.count($stages),
                'title' => 'Stage '.(count($stages) + 1),
                'desc' => $s,
                'question' => 'What defines Stage '.(count($stages) + 1).'?',
                'options' => [$this->truncateAtWord($s, 80), 'Distractor A', 'Distractor B', 'Distractor C'],
                'correctIndex' => 0,
                'rationale' => 'Synthesized from source text.',
                'sourcePassage' => $s,
                'simParams' => ['label' => 'Flow Rate', 'targetMin' => 42, 'targetMax' => 58],
            ];
        }

        $chunk = (int) ceil(count($stages) / 3);

        return [
            'phases' => array_map(fn ($i, $chunk) => [
                'name' => 'Phase '.($i + 1).': Process Segment',
                'stages' => $chunk,
            ], array_keys(array_chunk($stages, $chunk)), array_chunk($stages, $chunk)),
        ];
    }

    private function causeEffectPayload(array $sentences): array
    {
        $chains = [];
        foreach ($sentences as $sentence) {
            if (count($chains) >= 15) {
                break;
            }
            if (preg_match('/\b(leads to|results in|causes|caused by|consequently|therefore)\b/i', $sentence, $m)) {
                $parts = preg_split('/'.$m[0].'/i', $sentence, 2);
                $chains[] = [
                    'id' => 'ce-'.count($chains),
                    'cause' => $this->truncateAtWord(trim($parts[0] ?? ''), 90),
                    'effect' => $this->truncateAtWord(trim($parts[1] ?? 'Downstream effect.'), 100),
                    'rationale' => 'Causal semantic extraction from source.',
                    'sourcePassage' => trim($sentence),
                ];
            }
        }

        while (count($chains) < 9) {
            $s = trim($sentences[min(count($chains), count($sentences) - 1)]);
            $chains[] = [
                'id' => 'ce-'.count($chains),
                'cause' => 'Trigger factor '.(count($chains) + 1),
                'effect' => $this->truncateAtWord($s, 100),
                'rationale' => 'Derived from curriculum passage.',
                'sourcePassage' => $s,
            ];
        }

        $chunk = (int) ceil(count($chains) / 3);

        return [
            'levels' => array_map(fn ($i, $chunk) => [
                'name' => 'Level '.($i + 1).': Causal Cascade',
                'chains' => $chunk,
            ], array_keys(array_chunk($chains, $chunk)), array_chunk($chains, $chunk)),
        ];
    }

    private function comparisonPayload(array $sentences, string $title = 'Topic'): array
    {
        $categories = $this->inferComparisonCategories($title, $sentences);
        $cards = [];

        foreach (array_slice($sentences, 0, 20) as $idx => $sentence) {
            $cards[] = [
                'id' => 'card-'.$idx,
                'text' => trim($sentence),
                'category' => $categories[$idx % 2],
                'rationale' => 'Grounded comparison attribute from source.',
                'sourcePassage' => trim($sentence),
            ];
        }

        while (count($cards) < 16) {
            $idx = count($cards);
            $s = $sentences[min($idx, count($sentences) - 1)] ?? 'Additional comparison attribute.';
            $cards[] = [
                'id' => 'card-'.$idx,
                'text' => trim($s),
                'category' => $categories[$idx % 2],
                'rationale' => 'Synthesized comparison card from source.',
                'sourcePassage' => trim($s),
            ];
        }

        return ['categories' => $categories, 'cards' => $cards];
    }

    private function truncateAtWord(string $text, int $maxLen): string
    {
        $t = trim($text);
        if (mb_strlen($t) <= $maxLen) {
            return $t;
        }

        $slice = mb_substr($t, 0, $maxLen);
        $lastSpace = mb_strrpos($slice, ' ');
        if ($lastSpace !== false && $lastSpace > (int) floor($maxLen * 0.55)) {
            return trim(mb_substr($slice, 0, $lastSpace));
        }

        return trim($slice);
    }

    /** @param  array<int, string>  $sentences */
    private function inferComparisonCategories(string $title, array $sentences): array
    {
        $words = array_values(array_filter(
            preg_split('/\s+/', preg_replace('/[^\w\s]/', ' ', $title) ?? '') ?: [],
            static fn ($w) => mb_strlen($w) > 3
        ));

        if (count($words) >= 2) {
            return [
                ucfirst($words[0]).' traits',
                ucfirst($words[1]).' traits',
            ];
        }

        foreach ($sentences as $sentence) {
            $parts = preg_split('/\bvs\.?\b|\bversus\b/i', $sentence) ?: [];
            if (count($parts) >= 2) {
                return [
                    $this->truncateAtWord(trim($parts[0]), 40) ?: 'Group A',
                    $this->truncateAtWord(trim($parts[1]), 40) ?: 'Group B',
                ];
            }
        }

        return ['Core concepts', 'Related concepts'];
    }
}
