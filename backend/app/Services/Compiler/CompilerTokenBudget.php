<?php

namespace App\Services\Compiler;

/**
 * Estimates token pressure and tightens compile limits before Groq calls.
 */
class CompilerTokenBudget
{
    public const ABS_MAX_WORDS = 2000;

    public const ABS_MAX_CHARS = 12000;

    /**
     * @return array{
     *     max_words: int,
     *     max_chars: int,
     *     max_subtopics: int,
     *     max_game_items: int,
     *     completion_tokens_guide: int,
     *     completion_tokens_game: int,
     *     estimated_input_tokens: int,
     *     tier: string
     * }
     */
    public static function analyze(string $text, string $studyDepth = 'deep'): array
    {
        $words = count(preg_split('/\s+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY) ?: []);
        $chars = mb_strlen($text);
        $estimatedInput = (int) round($words * 1.35) + 900;

        if ($estimatedInput > 4500 || $words > 1600) {
            $budget = [
                'max_words' => 1000,
                'max_chars' => 6500,
                'max_subtopics' => 12,
                'max_game_items' => 10,
                'completion_tokens_guide' => 2400,
                'completion_tokens_game' => 1800,
                'completion_tokens_assessments' => 1400,
                'estimated_input_tokens' => $estimatedInput,
                'tier' => 'heavy',
            ];
        } elseif ($estimatedInput > 2800 || $words > 1000) {
            $budget = [
                'max_words' => 1400,
                'max_chars' => 9000,
                'max_subtopics' => 18,
                'max_game_items' => 14,
                'completion_tokens_guide' => 2800,
                'completion_tokens_game' => 2000,
                'completion_tokens_assessments' => 1600,
                'estimated_input_tokens' => $estimatedInput,
                'tier' => 'medium',
            ];
        } else {
            $budget = [
                'max_words' => self::ABS_MAX_WORDS,
                'max_chars' => self::ABS_MAX_CHARS,
                'max_subtopics' => 25,
                'max_game_items' => 21,
                'completion_tokens_guide' => 3200,
                'completion_tokens_game' => 2200,
                'completion_tokens_assessments' => 1800,
                'estimated_input_tokens' => $estimatedInput,
                'tier' => 'light',
            ];
        }

        return self::applyStudyDepth($budget, $studyDepth);
    }

    /**
     * @param  array<string, mixed>  $budget
     * @return array<string, mixed>
     */
    public static function applyStudyDepth(array $budget, string $studyDepth = 'deep'): array
    {
        $studyDepth = $studyDepth === 'broad' ? 'broad' : 'deep';
        $budget['study_depth'] = $studyDepth;

        if ($studyDepth === 'broad') {
            $budget['min_subtopics'] = 8;
            $budget['max_subtopics'] = min(15, (int) $budget['max_subtopics']);
            $budget['min_explanation_chars'] = 80;
            $budget['max_examples'] = 2;
            $budget['max_bullets'] = 4;
        } else {
            $budget['min_subtopics'] = 4;
            $budget['max_subtopics'] = min(8, (int) $budget['max_subtopics']);
            $budget['min_explanation_chars'] = 200;
            $budget['max_examples'] = 5;
            $budget['max_bullets'] = 8;
        }

        return $budget;
    }

    public static function trimSource(string $text, array $budget): string
    {
        $text = trim($text);
        $words = preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if (count($words) > $budget['max_words']) {
            $text = implode(' ', array_slice($words, 0, $budget['max_words']));
        }

        if (mb_strlen($text) > $budget['max_chars']) {
            $text = mb_substr($text, 0, $budget['max_chars']);
        }

        return $text;
    }
}
