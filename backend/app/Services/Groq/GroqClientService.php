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

    public function isConfigured(): bool
    {
        return ! empty(config('services.groq.api_key'));
    }

    /**
     * @param  array{max_tokens?: int, temperature?: float, models?: array<int, string>}  $options
     * @return array{data: array, usage: array<string, int>, elapsed_seconds: float, model: string}|null
     */
    public function chatJson(string $systemPrompt, string $userPrompt, ?string $model = null, array $options = []): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $candidateModels = $options['models'] ?? $this->resolveModelCandidates($model);
        $maxTokens = (int) ($options['max_tokens'] ?? 2200);
        $temperature = (float) ($options['temperature'] ?? 0.4);

        foreach ($candidateModels as $resolvedModel) {
            $start = microtime(true);

            try {
                $response = Http::withToken(config('services.groq.api_key'))
                    ->timeout(90)
                    ->post('https://api.groq.com/openai/v1/chat/completions', [
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
                    Log::warning('Groq API error', [
                        'model' => $resolvedModel,
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);

                    continue;
                }

                $content = $response->json('choices.0.message.content');
                if (! $content) {
                    continue;
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
                ];
            } catch (\Throwable $e) {
                Log::warning('Groq request failed', [
                    'model' => $resolvedModel,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return null;
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

        try {
            $response = Http::withToken(config('services.groq.api_key'))
                ->timeout(20)
                ->get('https://api.groq.com/openai/v1/models');

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
     * Role-based model priority (with failover handled by chatJson loop).
     *
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
            'generate' => [$primary, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', ...$fallbacks],
            'repair' => ['openai/gpt-oss-20b', 'llama-3.1-8b-instant', $primary],
            default => [$primary, ...$fallbacks],
        };

        return array_values(array_unique(array_filter($roleModels)));
    }
}
