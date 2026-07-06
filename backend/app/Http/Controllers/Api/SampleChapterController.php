<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SampleChapter;
use Illuminate\Http\JsonResponse;

class SampleChapterController extends Controller
{
    public function index(): JsonResponse
    {
        $samples = SampleChapter::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (SampleChapter $s) => $this->format($s));

        return response()->json(['data' => $samples]);
    }

    public function show(string $slug): JsonResponse
    {
        $sample = SampleChapter::where('slug', $slug)->where('is_active', true)->firstOrFail();

        return response()->json($this->format($sample, true));
    }

    private function format(SampleChapter $sample, bool $full = false): array
    {
        $theme = $sample->metadata['theme'] ?? [];

        $data = [
            'id' => $sample->id,
            'slug' => $sample->slug,
            'title' => $sample->title,
            'topic' => $sample->topic,
            'category' => $sample->category,
            'structure_type' => $sample->structure_type,
            'theme' => $theme,
            'demo_emoji' => $theme['demo_emoji'] ?? null,
            'mechanic' => $sample->metadata['mechanic'] ?? $this->mechanicLabel($sample->category),
        ];

        if ($full) {
            $data['originalText'] = $sample->original_text;
            $data['metadata'] = $sample->metadata;
            $data['payload'] = $sample->payload;
        }

        return $data;
    }

    private function mechanicLabel(string $category): string
    {
        return match ($category) {
            'Process' => 'Process Loop',
            'CauseEffect' => 'Cause-Effect Chain',
            'Comparison' => 'Comparison Sorter',
            default => 'Timeline Builder',
        };
    }
}
