<?php

namespace App\Services\Compiler;

class CompilerPayloadValidator
{
    public const MAX_JSON_BYTES = 40960;

    public const MAX_TOTAL_ITEMS = 21;

    private const CATEGORIES = ['Timeline', 'Process', 'CauseEffect', 'Comparison'];

    public function scalingRules(int $sourceChars): array
    {
        if ($sourceChars < 1500) {
            return ['max_levels' => 1, 'max_per_level' => 6, 'max_total' => 6];
        }
        if ($sourceChars < 5000) {
            return ['max_levels' => 2, 'max_per_level' => 6, 'max_total' => 12];
        }

        return ['max_levels' => 3, 'max_per_level' => 7, 'max_total' => 21];
    }

    /**
     * @return array{category: string, rationale: string, confidence: array<string, int>, payload: array, theme?: array}|null
     */
    public function validateAndSanitize(array $result, int $sourceChars): ?array
    {
        $category = $this->normalizeCategory($result['category'] ?? '');
        if (! in_array($category, self::CATEGORIES, true)) {
            return null;
        }

        $payload = $result['payload'] ?? null;
        if (! is_array($payload) || empty($payload)) {
            return null;
        }

        $rules = $this->scalingRules($sourceChars);
        $payload = $this->sanitizePayload($payload, $category, $rules);
        if ($payload === null) {
            return null;
        }

        $encoded = json_encode($payload);
        if ($encoded === false || strlen($encoded) > self::MAX_JSON_BYTES) {
            return null;
        }

        $confidence = $this->normalizeConfidence($result['confidence'] ?? [], $category);
        $rationale = trim((string) ($result['rationale'] ?? ''));
        if ($rationale === '') {
            $rationale = 'Structural classification based on dominant knowledge patterns in the source text.';
        }

        return [
            'category' => $category,
            'rationale' => $rationale,
            'confidence' => $confidence,
            'payload' => $payload,
            'theme' => is_array($result['theme'] ?? null) ? $result['theme'] : null,
        ];
    }

    private function normalizeCategory(string $category): string
    {
        return $this->normalizeCategoryPublic($category);
    }

    public function normalizeCategoryPublic(string $category): string
    {
        return match ($category) {
            'Process', 'Cyclical', 'Cycle' => 'Process',
            'CauseEffect', 'Cause-Effect', 'Causal' => 'CauseEffect',
            'Comparison', 'Comparative' => 'Comparison',
            default => 'Timeline',
        };
    }

    /** @return array<string, int> */
    private function normalizeConfidence(array $confidence, string $category): array
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

    /** @param array<string, mixed> $rules */
    private function sanitizePayload(array $payload, string $category, array $rules): ?array
    {
        return match ($category) {
            'Timeline' => $this->sanitizeTimeline($payload, $rules),
            'Process' => $this->sanitizeProcess($payload, $rules),
            'CauseEffect' => $this->sanitizeCauseEffect($payload, $rules),
            'Comparison' => $this->sanitizeComparison($payload, $rules),
            default => null,
        };
    }

    /** @param array<string, mixed> $rules */
    private function sanitizeTimeline(array $payload, array $rules): ?array
    {
        if (empty($payload['levels']) || ! is_array($payload['levels'])) {
            return null;
        }

        $levels = array_slice($payload['levels'], 0, $rules['max_levels']);
        $totalItems = 0;
        $sanitized = [];

        foreach ($levels as $level) {
            if (empty($level['events']) || ! is_array($level['events'])) {
                continue;
            }

            $events = [];
            foreach (array_slice($level['events'], 0, $rules['max_per_level']) as $idx => $event) {
                if ($totalItems >= $rules['max_total']) {
                    break 2;
                }
                if (empty($event['title']) || empty($event['sourcePassage'])) {
                    continue;
                }
                $events[] = [
                    'id' => $event['id'] ?? 'l'.(count($sanitized) + 1).'-evt-'.($idx + 1),
                    'title' => (string) $event['title'],
                    'date' => (string) ($event['date'] ?? 'Unknown'),
                    'desc' => (string) ($event['desc'] ?? ''),
                    'order' => $idx,
                    'emoji' => (string) ($event['emoji'] ?? '📅'),
                    'sourcePassage' => (string) $event['sourcePassage'],
                ];
                $totalItems++;
            }

            if ($events !== []) {
                $sanitized[] = [
                    'name' => (string) ($level['name'] ?? 'Level '.(count($sanitized) + 1)),
                    'events' => $events,
                ];
            }
        }

        return count($sanitized) > 0 ? ['levels' => $sanitized] : null;
    }

    /** @param array<string, mixed> $rules */
    private function sanitizeProcess(array $payload, array $rules): ?array
    {
        if (empty($payload['phases']) || ! is_array($payload['phases'])) {
            return null;
        }

        $phases = array_slice($payload['phases'], 0, $rules['max_levels']);
        $totalItems = 0;
        $sanitized = [];

        foreach ($phases as $phase) {
            if (empty($phase['stages']) || ! is_array($phase['stages'])) {
                continue;
            }

            $stages = [];
            foreach (array_slice($phase['stages'], 0, $rules['max_per_level']) as $idx => $stage) {
                if ($totalItems >= $rules['max_total']) {
                    break 2;
                }
                if (! $this->isValidProcessStage($stage)) {
                    continue;
                }
                $stageData = [
                    'id' => $stage['id'] ?? 'p-stg-'.($totalItems + 1),
                    'title' => (string) $stage['title'],
                    'desc' => (string) ($stage['desc'] ?? ''),
                    'question' => (string) $stage['question'],
                    'options' => array_values(array_slice($stage['options'], 0, 4)),
                    'correctIndex' => (int) $stage['correctIndex'],
                    'rationale' => (string) ($stage['rationale'] ?? ''),
                    'sourcePassage' => (string) $stage['sourcePassage'],
                ];
                if (! empty($stage['simParams']) && is_array($stage['simParams'])) {
                    $sp = $stage['simParams'];
                    $stageData['simParams'] = [
                        'label' => (string) ($sp['label'] ?? 'System Intensity'),
                        'targetMin' => max(0, min(90, (int) ($sp['targetMin'] ?? 40))),
                        'targetMax' => max(10, min(100, (int) ($sp['targetMax'] ?? 60))),
                    ];
                    if ($stageData['simParams']['targetMax'] <= $stageData['simParams']['targetMin']) {
                        $stageData['simParams']['targetMax'] = $stageData['simParams']['targetMin'] + 10;
                    }
                }
                $stages[] = $stageData;
                $totalItems++;
            }

            if ($stages !== []) {
                $sanitized[] = [
                    'name' => (string) ($phase['name'] ?? 'Phase '.(count($sanitized) + 1)),
                    'stages' => $stages,
                ];
            }
        }

        return count($sanitized) > 0 ? ['phases' => $sanitized] : null;
    }

    private function isValidProcessStage(mixed $stage): bool
    {
        if (! is_array($stage) || empty($stage['title']) || empty($stage['sourcePassage'])) {
            return false;
        }
        if (empty($stage['options']) || ! is_array($stage['options']) || count($stage['options']) !== 4) {
            return false;
        }
        $correctIndex = $stage['correctIndex'] ?? null;
        if (! is_int($correctIndex) && ! ctype_digit((string) $correctIndex)) {
            return false;
        }

        return (int) $correctIndex >= 0 && (int) $correctIndex <= 3;
    }

    /** @param array<string, mixed> $rules */
    private function sanitizeCauseEffect(array $payload, array $rules): ?array
    {
        if (empty($payload['levels']) || ! is_array($payload['levels'])) {
            return null;
        }

        $levels = array_slice($payload['levels'], 0, $rules['max_levels']);
        $totalItems = 0;
        $sanitized = [];

        foreach ($levels as $level) {
            if (empty($level['chains']) || ! is_array($level['chains'])) {
                continue;
            }

            $chains = [];
            foreach (array_slice($level['chains'], 0, $rules['max_per_level']) as $idx => $chain) {
                if ($totalItems >= $rules['max_total']) {
                    break 2;
                }
                if (empty($chain['cause']) || empty($chain['effect']) || empty($chain['sourcePassage'])) {
                    continue;
                }
                $chains[] = [
                    'id' => $chain['id'] ?? 'l'.(count($sanitized) + 1).'-ce-'.($idx + 1),
                    'cause' => (string) $chain['cause'],
                    'effect' => (string) $chain['effect'],
                    'rationale' => (string) ($chain['rationale'] ?? ''),
                    'sourcePassage' => (string) $chain['sourcePassage'],
                ];
                $totalItems++;
            }

            if ($chains !== []) {
                $sanitized[] = [
                    'name' => (string) ($level['name'] ?? 'Level '.(count($sanitized) + 1)),
                    'chains' => $chains,
                ];
            }
        }

        return count($sanitized) > 0 ? ['levels' => $sanitized] : null;
    }

    /** @param array<string, mixed> $rules */
    private function sanitizeComparison(array $payload, array $rules): ?array
    {
        if (empty($payload['categories']) || ! is_array($payload['categories']) || count($payload['categories']) < 2) {
            return null;
        }
        if (empty($payload['cards']) || ! is_array($payload['cards'])) {
            return null;
        }

        $categories = array_values(array_slice($payload['categories'], 0, 4));
        $cards = [];
        foreach (array_slice($payload['cards'], 0, $rules['max_total']) as $idx => $card) {
            if (empty($card['text']) || empty($card['category']) || empty($card['sourcePassage'])) {
                continue;
            }
            if (! in_array($card['category'], $categories, true)) {
                continue;
            }
            $cards[] = [
                'id' => $card['id'] ?? 'c-'.($idx + 1),
                'text' => (string) $card['text'],
                'category' => (string) $card['category'],
                'emoji' => (string) ($card['emoji'] ?? '⚡'),
                'rationale' => (string) ($card['rationale'] ?? ''),
                'sourcePassage' => (string) $card['sourcePassage'],
            ];
        }

        if (count($cards) < 4) {
            return null;
        }

        return ['categories' => $categories, 'cards' => $cards];
    }
}
