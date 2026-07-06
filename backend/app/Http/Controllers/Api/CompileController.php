<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compilation;
use App\Models\SampleChapter;
use App\Services\Compiler\CompilerPipelineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompileController extends Controller
{
    public function __construct(private CompilerPipelineService $pipeline) {}

    public function compileText(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|min:100',
            'source_title' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:100',
        ]);

        return $this->runCompilation(
            $validated['text'],
            $validated['source_title'] ?? 'Custom Upload',
            'text',
            $validated['model'] ?? null,
        );
    }

    public function compilePdf(Request $request): JsonResponse
    {
        $request->validate([
            'text' => 'required|string|min:100',
            'filename' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:100',
        ]);

        return $this->runCompilation(
            $request->input('text'),
            $request->input('filename', 'Uploaded PDF'),
            'pdf',
            $request->input('model'),
        );
    }

    public function show(string $uuid): JsonResponse
    {
        $compilation = Compilation::where('uuid', $uuid)->firstOrFail();

        return response()->json($this->formatResponse($compilation));
    }

    private function runCompilation(string $text, string $title, string $inputType, ?string $model): JsonResponse
    {
        try {
            $result = $this->pipeline->compile($text, $title, $inputType, $model);

            $compilation = Compilation::create([
                ...$result,
                'status' => 'completed',
            ]);

            return response()->json($this->formatResponse($compilation));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    private function formatResponse(Compilation $compilation): array
    {
        return [
            'uuid' => $compilation->uuid,
            'source_title' => $compilation->source_title,
            'originalText' => $compilation->source_text,
            'category' => $compilation->category,
            'title' => $compilation->source_title,
            'topic' => $compilation->classification['structure_type'] ?? '',
            'metadata' => $compilation->metadata,
            'payload' => $compilation->payload,
            'classification' => $compilation->classification,
            'mechanic_template' => $compilation->mechanic_template,
        ];
    }

    public function fromSample(SampleChapter $sample): JsonResponse
    {
        $compilation = Compilation::create([
            'source_title' => $sample->title,
            'source_text' => $sample->original_text,
            'input_type' => 'sample',
            'category' => $sample->category,
            'mechanic_template' => $sample->metadata['mechanic'] ?? $sample->category,
            'classification' => [
                'category' => $sample->category,
                'structure_type' => $sample->structure_type,
                'rationale' => $sample->metadata['rationale'] ?? '',
                'confidence_matrix' => $sample->metadata['confMatrix'] ?? [],
            ],
            'metadata' => $sample->metadata,
            'payload' => $sample->payload,
            'model_used' => $sample->metadata['model'] ?? null,
            'tokens_processed' => $sample->metadata['tokens'] ?? 0,
            'compilation_time_ms' => (int) (($sample->metadata['compTime'] ?? 3) * 1000),
            'status' => 'completed',
        ]);

        return response()->json($this->formatResponse($compilation));
    }
}
