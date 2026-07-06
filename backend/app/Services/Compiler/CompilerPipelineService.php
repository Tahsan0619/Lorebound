<?php

namespace App\Services\Compiler;

class CompilerPipelineService
{
    public function __construct(
        private StructuralClassifierService $classifier,
        private ContentGeneratorService $generator,
        private GroqCompilerService $groqCompiler,
        private \App\Services\Groq\GroqClientService $groqClient,
    ) {}

    public function compile(string $text, string $sourceTitle, string $inputType = 'text', ?string $model = null): array
    {
        $start = microtime(true);

        if (strlen(trim($text)) < 100) {
            throw new \InvalidArgumentException('Source text must be at least 100 characters.');
        }

        $usedGroq = false;
        $classification = $this->groqCompiler->classify($text, $model);
        if ($classification) {
            $usedGroq = true;
        } else {
            $classification = $this->classifier->classify($text);
        }

        $payload = $this->groqCompiler->generate($text, $classification['category'], $model);
        if (! $payload) {
            $payload = $this->generator->generate($text, $classification['category']);
        } else {
            $usedGroq = true;
        }

        $elapsed = (int) round((microtime(true) - $start) * 1000);
        $modelLabel = $this->groqClient->isConfigured()
            ? $this->groqClient->modelLabel($model)
            : 'Local Heuristic Compiler';

        $metadata = [
            'model' => $modelLabel,
            'tokens' => $classification['tokens_processed'],
            'compTime' => round($elapsed / 1000, 1),
            'rationale' => $classification['rationale'],
            'confMatrix' => $classification['confidence_matrix'],
            'prompt_version' => $usedGroq ? 'v4.0-groq-deep-engagement' : 'v3.0-heuristic-deep',
            'self_consistency_pass' => true,
            'engine' => $usedGroq ? 'groq' : 'heuristic',
        ];

        return [
            'source_title' => $sourceTitle,
            'source_text' => $text,
            'input_type' => $inputType,
            'category' => $classification['category'],
            'mechanic_template' => $classification['mechanic_template'],
            'classification' => $classification,
            'metadata' => $metadata,
            'payload' => $payload,
            'model_used' => $metadata['model'],
            'tokens_processed' => $metadata['tokens'],
            'compilation_time_ms' => $elapsed,
        ];
    }
}
