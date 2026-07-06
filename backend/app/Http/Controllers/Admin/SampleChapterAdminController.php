<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SampleChapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SampleChapterAdminController extends Controller
{
    public function index(): View
    {
        return view('admin.samples.index', [
            'samples' => SampleChapter::orderBy('sort_order')->paginate(15),
        ]);
    }

    public function create(): View
    {
        return view('admin.samples.form', ['sample' => new SampleChapter()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        SampleChapter::create($data);

        return redirect()->route('admin.samples.index')->with('success', 'Sample chapter created.');
    }

    public function edit(SampleChapter $sample): View
    {
        return view('admin.samples.form', ['sample' => $sample]);
    }

    public function update(Request $request, SampleChapter $sample): RedirectResponse
    {
        $sample->update($this->validated($request));

        return redirect()->route('admin.samples.index')->with('success', 'Sample chapter updated.');
    }

    public function destroy(SampleChapter $sample): RedirectResponse
    {
        $sample->delete();

        return redirect()->route('admin.samples.index')->with('success', 'Sample chapter deleted.');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'slug' => 'required|string|max:100|unique:sample_chapters,slug,'.($request->route('sample')?->id ?? 'NULL').',id',
            'title' => 'required|string|max:255',
            'topic' => 'nullable|string|max:255',
            'category' => 'required|in:Timeline,Process,CauseEffect,Comparison',
            'structure_type' => 'required|string|max:100',
            'original_text' => 'required|string|min:100',
            'payload' => 'required|json',
            'metadata' => 'nullable|json',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $data['payload'] = json_decode($data['payload'], true);
        $data['metadata'] = isset($data['metadata']) ? json_decode($data['metadata'], true) : null;
        $data['is_active'] = $request->boolean('is_active');

        return $data;
    }
}
