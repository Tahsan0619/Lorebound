<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Compilation;
use App\Models\GameSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CompilationAdminController extends Controller
{
    public function index(Request $request): View
    {
        $selectedUuid = $request->query('selected');

        $totalCompilations = Compilation::count();
        $successRate = round((float) (GameSession::avg('accuracy') ?? 0), 1);
        $activeModels = (int) Compilation::query()
            ->whereNotNull('model_used')
            ->distinct('model_used')
            ->count('model_used');
        $avgPipelineSeconds = round(((float) (Compilation::avg('compilation_time_ms') ?? 0)) / 1000, 0);

        $sampleLogCount = Compilation::where('input_type', 'sample')->count();
        $compilationsPaginator = Compilation::userCompiled()->latest()->paginate(20);

        $selectedCompilation = null;
        if (! empty($selectedUuid)) {
            $selectedCompilation = Compilation::where('uuid', $selectedUuid)->first();
        }
        if (empty($selectedCompilation)) {
            $selectedCompilation = $compilationsPaginator->getCollection()->first();
        }

        return view('admin.compilations.index', [
            'compilations' => $compilationsPaginator,
            'sample_log_count' => $sampleLogCount,
            'metrics' => [
                'total_compilations' => $totalCompilations,
                'success_rate' => $successRate,
                'active_models' => $activeModels,
                'avg_pipeline_seconds' => $avgPipelineSeconds,
            ],
            'selectedCompilation' => $selectedCompilation,
            'selectedUuid' => $selectedUuid,
        ]);
    }

    public function show(Compilation $compilation): View
    {
        return view('admin.compilations.show', compact('compilation'));
    }

    public function destroy(Compilation $compilation): RedirectResponse
    {
        if (! $compilation->isUserCompiled()) {
            return back()->with('error', 'Sample play-through records cannot be deleted here. Use purge sample logs instead.');
        }

        $title = $compilation->source_title;
        $compilation->delete();

        return redirect()
            ->route('admin.compilations.index')
            ->with('success', "Deleted \"{$title}\".");
    }

    public function purgeSampleLogs(): RedirectResponse
    {
        $count = Compilation::where('input_type', 'sample')->count();
        Compilation::where('input_type', 'sample')->delete();

        return redirect()
            ->route('admin.compilations.index')
            ->with('success', "Purged {$count} duplicate sample play log(s).");
    }
}
