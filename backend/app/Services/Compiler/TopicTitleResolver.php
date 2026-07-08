<?php

namespace App\Services\Compiler;

class TopicTitleResolver
{
    /** @var array<int, string> */
    private const GENERIC_TITLES = [
        '',
        'custom upload',
        'uploaded pdf',
        'sample chapter',
        'untitled',
        'untitled topic',
        'study topic',
    ];

    public static function isGeneric(string $title): bool
    {
        $normalized = strtolower(trim($title));

        return in_array($normalized, self::GENERIC_TITLES, true);
    }

    public static function resolve(string $provided, ?string $aiTitle, string $text, string $category = ''): string
    {
        if (! self::isGeneric($provided)) {
            return self::sanitize(trim($provided));
        }

        $ai = self::sanitize(trim((string) $aiTitle));
        if ($ai !== '') {
            return $ai;
        }

        return self::inferFromText($text, $category);
    }

    public static function inferFromText(string $text, string $category = ''): string
    {
        $text = trim($text);
        if ($text === '') {
            return $category !== '' ? "{$category} Study Topic" : 'Study Topic';
        }

        $lines = preg_split('/\R+/u', $text, 4) ?: [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || mb_strlen($line) < 8) {
                continue;
            }

            if (preg_match('/^#+\s*(.+)$/u', $line, $m)) {
                return self::sanitize($m[1]);
            }

            if (preg_match('/^title\s*:\s*(.+)$/iu', $line, $m)) {
                return self::sanitize($m[1]);
            }

            if (preg_match('/^topic\s*:\s*(.+)$/iu', $line, $m)) {
                return self::sanitize($m[1]);
            }

            if (preg_match('/^(.{12,90}?)[.!?](\s|$)/u', $line, $m)) {
                return self::sanitize($m[1]);
            }

            $words = preg_split('/\s+/u', $line, -1, PREG_SPLIT_NO_EMPTY) ?: [];
            if (count($words) >= 3) {
                return self::sanitize(implode(' ', array_slice($words, 0, 10)));
            }
        }

        return $category !== '' ? "{$category} Study Topic" : 'Study Topic';
    }

    private static function sanitize(string $title): string
    {
        $title = preg_replace('/\s+/u', ' ', trim($title)) ?? '';
        $title = trim($title, " \t\n\r\0\x0B\"'“”‘’");

        if ($title === '') {
            return 'Study Topic';
        }

        return mb_substr($title, 0, 120);
    }
}
