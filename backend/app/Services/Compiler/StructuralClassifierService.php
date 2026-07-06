<?php

namespace App\Services\Compiler;

class StructuralClassifierService
{
    private const MECHANIC_MAP = [
        'Timeline' => 'Timeline Builder',
        'Process' => 'Process Loop',
        'CauseEffect' => 'Cause-Effect Chain',
        'Comparison' => 'Comparison Sorter',
    ];

    public function classify(string $text): array
    {
        $lower = strtolower($text);
        $wordCount = str_word_count($text);

        $scores = [
            'seq' => 12,
            'cyc' => 12,
            'cau' => 12,
            'comp' => 12,
        ];

        $dateMatches = preg_match_all('/\b(19\d{2}|20\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i', $text);
        if ($dateMatches >= 2) {
            $scores['seq'] += 35 + min($dateMatches * 8, 40);
        }
        if (preg_match_all('/\b(first|then|next|after|before|finally|subsequently|later|earlier)\b/i', $text, $m)) {
            $scores['seq'] += min(count($m[0]) * 6, 25);
        }

        if (preg_match_all('/\b(cycle|process|stage|phase|step|repeats|circulation|loop|pathway|converts)\b/i', $text, $m)) {
            $scores['cyc'] += min(count($m[0]) * 10, 55);
        }

        if (preg_match_all('/\b(cause|effect|leads to|results in|consequently|therefore|trigger|because|due to)\b/i', $text, $m)) {
            $scores['cau'] += min(count($m[0]) * 10, 55);
        }

        if (preg_match_all('/\b(versus| vs |compare|comparison|difference|contrast|whereas|in contrast|unlike|while)\b/i', $text, $m)) {
            $scores['comp'] += min(count($m[0]) * 10, 55);
        }

        $dominant = array_search(max($scores), $scores, true);
        $category = match ($dominant) {
            'seq' => 'Timeline',
            'cyc' => 'Process',
            'cau' => 'CauseEffect',
            'comp' => 'Comparison',
            default => 'Timeline',
        };

        $rationale = match ($category) {
            'Timeline' => 'Detected chronological markers and ordered events. Timeline Builder selected.',
            'Process' => 'Text describes a cyclical or staged process. Process Loop template selected.',
            'CauseEffect' => 'Causal language and chain dependencies detected. Cause-Effect Chain selected.',
            'Comparison' => 'Comparative structure between entities detected. Comparison Sorter selected.',
        };

        return [
            'category' => $category,
            'mechanic_template' => self::MECHANIC_MAP[$category],
            'structure_type' => $this->structureLabel($category),
            'rationale' => $rationale,
            'confidence_matrix' => $scores,
            'confidence' => $scores[match ($category) {
                'Timeline' => 'seq',
                'Process' => 'cyc',
                'CauseEffect' => 'cau',
                'Comparison' => 'comp',
            }],
            'tokens_processed' => (int) round($wordCount * 1.3),
        ];
    }

    private function structureLabel(string $category): string
    {
        return match ($category) {
            'Timeline' => 'Sequential / Timeline',
            'Process' => 'Cyclical / Process',
            'CauseEffect' => 'Cause-and-Effect',
            'Comparison' => 'Comparative / Classification',
        };
    }
}
