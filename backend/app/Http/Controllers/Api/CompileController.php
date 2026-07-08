<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compilation;
use App\Models\SampleChapter;
use App\Services\Compiler\AssessmentBuilderService;
use App\Services\Compiler\CompilerPipelineService;
use App\Services\Compiler\LearningGuideBuilderService;
use App\Services\Compiler\TextSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompileController extends Controller
{
    public function __construct(
        private CompilerPipelineService $pipeline,
        private LearningGuideBuilderService $learningGuideBuilder,
        private AssessmentBuilderService $assessmentBuilder,
    ) {}

    public function compileText(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|min:100|max:12000',
            'source_title' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:100',
            'study_depth' => 'nullable|in:deep,broad',
        ]);

        return $this->runCompilation(
            $validated['text'],
            trim((string) ($validated['source_title'] ?? '')),
            'text',
            $validated['model'] ?? null,
            $validated['study_depth'] ?? 'deep',
        );
    }

    public function compilePdf(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|min:100|max:12000',
            'filename' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:100',
            'study_depth' => 'nullable|in:deep,broad',
        ]);

        return $this->runCompilation(
            $validated['text'],
            trim((string) ($validated['filename'] ?? '')),
            'pdf',
            $validated['model'] ?? null,
            $validated['study_depth'] ?? 'deep',
        );
    }

    public function show(string $uuid): JsonResponse
    {
        $compilation = Compilation::where('uuid', $uuid)->firstOrFail();

        return response()->json(TextSanitizer::deep($this->formatResponse($compilation)));
    }

    public function index(): JsonResponse
    {
        $items = Compilation::query()
            ->whereIn('input_type', ['text', 'pdf'])
            ->where('status', 'completed')
            ->orderByDesc('created_at')
            ->limit(24)
            ->get()
            ->map(fn (Compilation $c) => [
                'uuid' => $c->uuid,
                'title' => $c->source_title,
                'category' => $c->category,
                'topic' => $c->classification['structure_type'] ?? '',
                'input_type' => $c->input_type,
                'created_at' => $c->created_at?->toIso8601String(),
                'theme' => $c->metadata['theme'] ?? null,
                'mechanic' => $c->metadata['mechanic'] ?? $c->mechanic_template,
                'demo_emoji' => $c->metadata['theme']['demo_emoji'] ?? null,
            ]);

        return response()->json(['data' => $items]);
    }

    public function destroy(string $uuid): JsonResponse
    {
        $compilation = Compilation::where('uuid', $uuid)->firstOrFail();

        if (! $compilation->isUserCompiled()) {
            return response()->json(['message' => 'Only user-compiled games can be deleted.'], 403);
        }

        $compilation->delete();

        return response()->json(['message' => 'Compilation deleted.']);
    }

    private function runCompilation(string $text, string $title, string $inputType, ?string $model, string $studyDepth = 'deep'): JsonResponse
    {
        try {
            $result = $this->pipeline->compile($text, $title, $inputType, $model, $studyDepth);

            $compilation = Compilation::create([
                ...$result,
                'status' => 'completed',
            ]);

            return response()->json(TextSanitizer::deep($this->formatResponse($compilation)));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    private function formatResponse(Compilation $compilation): array
    {
        return [
            'uuid' => $compilation->uuid,
            'source_title' => $compilation->source_title,
            'title' => $compilation->source_title,
            'originalText' => $compilation->source_text,
            'category' => $compilation->category,
            'topic' => $compilation->classification['structure_type'] ?? '',
            'metadata' => $compilation->metadata,
            'payload' => $compilation->payload,
            'classification' => $compilation->classification,
            'mechanic_template' => $compilation->mechanic_template,
        ];
    }

    public function fromSample(SampleChapter $sample): JsonResponse
    {
        $metadata = $sample->metadata ?? [];
        if (empty($metadata['learningGuide'])) {
            $metadata['learningGuide'] = $this->learningGuideBuilder->fromPayload(
                $sample->title,
                $sample->original_text ?? '',
                $sample->category,
                $sample->payload ?? [],
                'deep',
            );
        }
        if (empty($metadata['assessments'])) {
            $subtopics = $metadata['learningGuide']['subtopics'] ?? [];
            $metadata['assessments'] = $this->assessmentBuilder->fromSubtopics(
                $sample->title,
                $sample->category,
                $subtopics,
                $sample->original_text ?? '',
            );
        }

        return response()->json(TextSanitizer::deep($this->formatSampleResponse($sample, $metadata)));
    }

    /** @param  array<string, mixed>  $metadata */
    private function formatSampleResponse(SampleChapter $sample, array $metadata): array
    {
        return [
            'uuid' => null,
            'source_title' => $sample->title,
            'originalText' => $sample->original_text,
            'category' => $sample->category,
            'title' => $sample->title,
            'topic' => $sample->structure_type,
            'metadata' => $metadata,
            'payload' => $sample->payload,
            'classification' => [
                'category' => $sample->category,
                'structure_type' => $sample->structure_type,
                'rationale' => $metadata['rationale'] ?? '',
                'confidence_matrix' => $metadata['confMatrix'] ?? [],
            ],
            'mechanic_template' => $metadata['mechanic'] ?? $sample->category,
            'from_sample' => true,
            'sample_slug' => $sample->slug,
        ];
    }
}
