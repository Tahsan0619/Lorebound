<?php

/**
 * Preferred sample catalog. Delegates to samples.json so one source of truth
 * stays complete and re-seedable.
 */
$path = __DIR__ . DIRECTORY_SEPARATOR . 'samples.json';
if (! is_file($path)) {
    return [];
}

$samples = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

return is_array($samples) ? $samples : [];
