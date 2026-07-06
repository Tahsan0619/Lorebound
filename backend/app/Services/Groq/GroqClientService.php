<?php

namespace App\Services\Groq;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqClientService
{
    public function isConfigured(): bool
    {
        return ! empty(config('services.groq.api_key'));
    }

    public function chatJson(string $systemPrompt, string $userPrompt, ?string $model = null): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $model = $model ?: config('services.groq.model', 'llama-3.3-70b-versatile');

        try {
            $response = Http::withToken(config('services.groq.api_key'))
                ->timeout(90)
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => $this->resolveModel($model),
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'temperature' => 0.2,
                    'response_format' => ['type' => 'json_object'],
                ]);

            if (! $response->successful()) {
                Log::warning('Groq API error', ['status' => $response->status(), 'body' => $response->body()]);

                return null;
            }

            $content = $response->json('choices.0.message.content');
            if (! $content) {
                return null;
            }

            return json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable $e) {
            Log::warning('Groq request failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    public function resolveModel(?string $frontendModel): string
    {
        return match ($frontendModel) {
            'llama3-8b', 'llama-3.1-8b-instant' => 'llama-3.1-8b-instant',
            'gemma2-9b' => 'llama-3.1-8b-instant',
            default => config('services.groq.model', 'llama-3.3-70b-versatile'),
        };
    }

    public function modelLabel(?string $frontendModel): string
    {
        $resolved = $this->resolveModel($frontendModel);

        return match ($resolved) {
            'llama-3.1-8b-instant' => 'Llama 3.1 8B (Groq Cloud)',
            default => 'Llama 3.3 70B (Groq Cloud)',
        };
    }
}
