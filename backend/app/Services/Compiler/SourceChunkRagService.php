<?php

namespace App\Services\Compiler;

/**
 * Lightweight RAG: chunk source text and retrieve best passages per subtopic.
 */
class SourceChunkRagService
{
    /**
     * @return array<int, array{index: int, text: string}>
     */
    public function chunk(string $text, int $chunkSize = 420): array
    {
        $text = preg_replace('/\s+/u', ' ', trim($text)) ?? '';
        if ($text === '') {
            return [];
        }

        $sentences = preg_split('/(?<=[.!?])\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [$text];
        $chunks = [];
        $buffer = '';
        $index = 0;

        foreach ($sentences as $sentence) {
            $candidate = trim($buffer === '' ? $sentence : $buffer.' '.$sentence);
            if (mb_strlen($candidate) > $chunkSize && $buffer !== '') {
                $chunks[] = ['index' => $index++, 'text' => trim($buffer)];
                $buffer = $sentence;
            } else {
                $buffer = $candidate;
            }
        }

        if (trim($buffer) !== '') {
            $chunks[] = ['index' => $index, 'text' => trim($buffer)];
        }

        return $chunks;
    }

    /**
     * @param  array<int, string>  $keywords
     */
    public function bestPassage(string $text, array $keywords, int $maxLen = 220): string
    {
        $chunks = $this->chunk($text);
        if ($chunks === []) {
            return mb_substr($text, 0, $maxLen);
        }

        $best = $chunks[0]['text'];
        $bestScore = -1;
        foreach ($chunks as $chunk) {
            $score = $this->scoreChunk($chunk['text'], $keywords);
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $chunk['text'];
            }
        }

        return mb_strlen($best) > $maxLen ? mb_substr($best, 0, $maxLen).'…' : $best;
    }

    /**
     * @param  array<int, array<string, mixed>>  $subtopics
     * @return array<int, array<string, mixed>>
     */
    public function attachPassages(string $sourceText, array $subtopics): array
    {
        $chunks = $this->chunk($sourceText);
        $usedChunkIndices = [];

        foreach ($subtopics as $i => $subtopic) {
            $keywords = $this->keywordsFromSubtopic($subtopic);
            $existing = trim((string) ($subtopic['sourcePassage'] ?? ''));
            if ($existing === '') {
                [$passage, $chunkIndex] = $this->bestPassageFromChunks($chunks, $keywords, $usedChunkIndices);
                $subtopics[$i]['sourcePassage'] = $passage;
                if ($chunkIndex >= 0) {
                    $usedChunkIndices[] = $chunkIndex;
                }
            }
        }

        return $subtopics;
    }

    /**
     * @param  array<int, array{index: int, text: string}>  $chunks
     * @param  array<int, int>  $excludeIndices
     * @return array{0: string, 1: int}
     */
    private function bestPassageFromChunks(array $chunks, array $keywords, array $excludeIndices, int $maxLen = 220): array
    {
        if ($chunks === []) {
            return ['', -1];
        }

        $best = $chunks[0]['text'];
        $bestScore = -1;
        $bestIndex = $chunks[0]['index'];

        foreach ($chunks as $chunk) {
            if (in_array($chunk['index'], $excludeIndices, true)) {
                continue;
            }
            $score = $this->scoreChunk($chunk['text'], $keywords);
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $chunk['text'];
                $bestIndex = $chunk['index'];
            }
        }

        if ($bestScore < 0 && $excludeIndices !== []) {
            foreach ($chunks as $chunk) {
                $score = $this->scoreChunk($chunk['text'], $keywords);
                if ($score > $bestScore) {
                    $bestScore = $score;
                    $best = $chunk['text'];
                    $bestIndex = $chunk['index'];
                }
            }
        }

        $text = mb_strlen($best) > $maxLen ? mb_substr($best, 0, $maxLen).'…' : $best;

        return [$text, $bestIndex];
    }

    /**
     * @param  array<string, mixed>  $subtopic
     * @return array<int, string>
     */
    private function keywordsFromSubtopic(array $subtopic): array
    {
        $raw = implode(' ', [
            (string) ($subtopic['title'] ?? ''),
            (string) ($subtopic['explanation'] ?? ''),
            ...((array) ($subtopic['examples'] ?? [])),
        ]);
        $words = preg_split('/[^a-zA-Z0-9]+/u', strtolower($raw), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return array_values(array_unique(array_filter($words, static fn ($w) => mb_strlen($w) >= 4)));
    }

    /**
     * @param  array<int, string>  $keywords
     */
    private function scoreChunk(string $chunk, array $keywords): int
    {
        $lower = strtolower($chunk);
        $score = 0;
        foreach ($keywords as $kw) {
            if ($kw !== '' && str_contains($lower, strtolower($kw))) {
                $score += 2;
            }
        }

        return $score;
    }
}
