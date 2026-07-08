<?php

namespace App\Services\Groq;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqClientService
{
    /**
     * @var array<int, string>|null
     */
    private ?array $cachedActiveTextModels = null;

    /**
     * @return array<int, string>
     */
    public function apiKeys(): array
    {
        $configured = array_values(array_filter(array_map(
            static fn ($item) => trim((string) $item),
            (array) config('services.groq.api_keys', [])
        )));

        if ($configured !== []) {
            return array_values(array_unique($configured));
        }

        $single = trim((string) config('services.groq.api_key', ''));

        return $single !== '' ? [$single] : [];
    }

    public function isConfigured(): bool
    {
        return $this->apiKeys() !== [];
    }

    /**
     * @param  array{max_tokens?: int, temperature?: float, models?: array<int, string>}  $options
     * @return array{data: array, usage: array<string, int>, elapsed_seconds: float, model: string, api_key_index: int}|null
     */
    public function chatJson(string $systemPrompt, string $userPrompt, ?string $model = null, array $options = []): ?array
    {
        $keys = $this->apiKeys();
        if ($keys === []) {
            return null;
        }

        $candidateModels = $options['models'] ?? $this->resolveModelCandidates($model);
        $maxTokens = (int) ($options['max_tokens'] ?? 2200);
        $temperature = (float) ($options['temperature'] ?? 0.4);

        foreach ($keys as $keyIndex => $apiKey) {
            foreach ($candidateModels as $resolvedModel) {
                $result = $this->attemptChatJson(
                    $apiKey,
                    $keyIndex,
                    $resolvedModel,
                    $systemPrompt,
                    $userPrompt,
                    $maxTokens,
                    $temperature
                );

                if ($result !== null) {
                    return $result;
                }
            }
        }

        return null;
    }

    /**
     * @return array{data: array, usage: array<string, int>, elapsed_seconds: float, model: string, api_key_index: int}|null
     */
    private function attemptChatJson(
        string $apiKey,
        int $keyIndex,
        string $resolvedModel,
        string $systemPrompt,
        string $userPrompt,
        int $maxTokens,
        float $temperature
    ): ?array {
        $start = microtime(true);

        try {
            $http = Http::withToken($apiKey)->timeout(90);

            if (! config('services.groq.verify_ssl', true)) {
                $http = $http->withOptions(['verify' => false]);
            }

            $response = $http->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => $resolvedModel,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
                'top_p' => 0.9,
                'response_format' => ['type' => 'json_object'],
            ]);

            if (! $response->successful()) {
                $body = (string) $response->body();
                Log::warning('Groq API error', [
                    'api_key_index' => $keyIndex + 1,
                    'model' => $resolvedModel,
                    'status' => $response->status(),
                    'body' => mb_substr($body, 0, 500),
                ]);

                if ($this->shouldRotateKey($response->status(), $body)) {
                    return null;
                }

                return null;
            }

            $content = $response->json('choices.0.message.content');
            $finishReason = (string) ($response->json('choices.0.finish_reason') ?? '');

            if (! $content || $finishReason === 'length') {
                Log::warning('Groq response truncated or empty', [
                    'api_key_index' => $keyIndex + 1,
                    'model' => $resolvedModel,
                    'finish_reason' => $finishReason,
                ]);

                return null;
            }

            $data = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
            $usage = $response->json('usage') ?? [];

            return [
                'data' => $data,
                'usage' => [
                    'prompt_tokens' => (int) ($usage['prompt_tokens'] ?? 0),
                    'completion_tokens' => (int) ($usage['completion_tokens'] ?? 0),
                    'total_tokens' => (int) ($usage['total_tokens'] ?? 0),
                ],
                'elapsed_seconds' => microtime(true) - $start,
                'model' => $resolvedModel,
                'api_key_index' => $keyIndex + 1,
            ];
        } catch (\Throwable $e) {
            Log::warning('Groq request failed', [
                'api_key_index' => $keyIndex + 1,
                'model' => $resolvedModel,
                'error' => $e->getMessage(),
            ]);

            if ($this->shouldRotateKeyFromMessage($e->getMessage())) {
                return null;
            }

            return null;
        }
    }

    private function shouldRotateKey(int $status, string $body): bool
    {
        if (in_array($status, [401, 402, 403, 429], true)) {
            return true;
        }

        $lower = strtolower($body);

        return str_contains($lower, 'rate_limit')
            || str_contains($lower, 'rate limit')
            || str_contains($lower, 'tokens per')
            || str_contains($lower, 'token limit')
            || str_contains($lower, 'insufficient')
            || str_contains($lower, 'quota');
    }

    private function shouldRotateKeyFromMessage(string $message): bool
    {
        $lower = strtolower($message);

        return str_contains($lower, 'rate limit')
            || str_contains($lower, '429')
            || str_contains($lower, 'token')
            || str_contains($lower, 'quota');
    }

    public function resolveModel(?string $frontendModel): string
    {
        return $this->resolveModelCandidates($frontendModel)[0];
    }

    /**
     * @return array<int, string>
     */
    public function resolveModelCandidates(?string $frontendModel): array
    {
        $legacyMap = [
            'llama3-70b' => 'llama-3.3-70b-versatile',
            'llama3-8b' => 'llama-3.1-8b-instant',
            'gemma2-9b' => 'llama-3.1-8b-instant',
        ];

        $selected = trim((string) $frontendModel);
        if ($selected !== '') {
            $selected = $legacyMap[$selected] ?? $selected;

            if (! in_array($selected, ['auto', 'all'], true)) {
                return [$selected];
            }
        }

        $primary = config('services.groq.model', 'llama-3.3-70b-versatile');
        $configuredFallbacks = array_values(array_filter(array_map(
            static fn ($item) => trim((string) $item),
            (array) config('services.groq.model_fallbacks', [])
        )));

        $activeModels = $this->fetchActiveTextModels();
        $priorityModels = [
            $primary,
            ...$configuredFallbacks,
            ...$activeModels,
        ];

        return array_values(array_unique(array_filter($priorityModels)));
    }

    public function modelLabel(?string $model): string
    {
        $resolved = trim((string) $model);
        if ($resolved === '') {
            $resolved = config('services.groq.model', 'llama-3.3-70b-versatile');
        }

        return match ($resolved) {
            'llama-3.1-8b-instant' => 'Llama 3.1 8B (Groq Cloud)',
            'llama-3.3-70b-versatile' => 'Llama 3.3 70B (Groq Cloud)',
            'openai/gpt-oss-20b' => 'GPT-OSS 20B (Groq Cloud)',
            'openai/gpt-oss-120b' => 'GPT-OSS 120B (Groq Cloud)',
            default => sprintf('%s (Groq Cloud)', $resolved),
        };
    }

    /**
     * @return array<int, string>
     */
    private function fetchActiveTextModels(): array
    {
        if ($this->cachedActiveTextModels !== null) {
            return $this->cachedActiveTextModels;
        }

        $keys = $this->apiKeys();
        if ($keys === []) {
            return $this->cachedActiveTextModels = [];
        }

        try {
            $http = Http::withToken($keys[0])->timeout(20);

            if (! config('services.groq.verify_ssl', true)) {
                $http = $http->withOptions(['verify' => false]);
            }

            $response = $http->get('https://api.groq.com/openai/v1/models');

            if (! $response->successful()) {
                return $this->cachedActiveTextModels = [];
            }

            $models = (array) $response->json('data', []);
            $activeIds = [];
            foreach ($models as $model) {
                $id = trim((string) ($model['id'] ?? ''));
                if ($id === '') {
                    continue;
                }

                $isActive = $model['active'] ?? true;
                if (! $isActive || ! $this->isTextGenerationModel($id)) {
                    continue;
                }

                $activeIds[] = $id;
            }

            return $this->cachedActiveTextModels = array_values(array_unique($activeIds));
        } catch (\Throwable $e) {
            Log::warning('Groq model list fetch failed', ['error' => $e->getMessage()]);

            return $this->cachedActiveTextModels = [];
        }
    }

    private function isTextGenerationModel(string $id): bool
    {
        $lower = strtolower($id);
        $excludedTokens = ['whisper', 'tts', 'orpheus', 'prompt-guard', 'safeguard'];

        foreach ($excludedTokens as $token) {
            if (str_contains($lower, $token)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array<int, string>
     */
    public function modelsForRole(string $role): array
    {
        $primary = config('services.groq.model', 'llama-3.3-70b-versatile');
        $fallbacks = array_values(array_filter(array_map(
            static fn ($item) => trim((string) $item),
            (array) config('services.groq.model_fallbacks', [])
        )));

        $roleModels = match ($role) {
            'decompose' => ['llama-3.1-8b-instant', $primary, ...$fallbacks],
            'evaluate' => [$primary, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant', ...$fallbacks],
            'generate' => [$primary, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', ...$fallbacks],
            'repair' => ['openai/gpt-oss-20b', 'llama-3.1-8b-instant', $primary],
            default => [$primary, ...$fallbacks],
        };

        return array_values(array_unique(array_filter($roleModels)));
    }
}
