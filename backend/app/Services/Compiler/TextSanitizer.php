<?php

namespace App\Services\Compiler;

/**
 * Normalizes AI and UI copy: no em-dashes or en-dashes in user-facing text.
 */
class TextSanitizer
{
    public static function text(string $value): string
    {
        if ($value === '') {
            return $value;
        }

        $emDash = "\u{2014}";
        $enDash = "\u{2013}";

        $comma = ', ';

        $value = str_replace(
            [" {$emDash} ", " {$enDash} ", $emDash, $enDash],
            [$comma, $comma, $comma, $comma],
            $value
        );

        $value = preg_replace('/\s{2,}/', ' ', $value) ?? $value;

        return trim($value);
    }

    public static function deep(mixed $value): mixed
    {
        if (is_string($value)) {
            return self::text($value);
        }

        if (! is_array($value)) {
            return $value;
        }

        $out = [];
        foreach ($value as $key => $item) {
            $out[$key] = self::deep($item);
        }

        return $out;
    }
}
