<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Compilation;
use App\Models\GameSession;
use App\Models\SampleChapter;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(): View
    {
        return view('admin.dashboard', [
            'stats' => [
                'samples' => SampleChapter::count(),
                'compilations' => Compilation::userCompiled()->count(),
                'sessions' => GameSession::count(),
                'today_compilations' => Compilation::userCompiled()->whereDate('created_at', today())->count(),
                'sample_logs' => Compilation::where('input_type', 'sample')->count(),
            ],
            'recent_compilations' => Compilation::userCompiled()->latest()->limit(8)->get(),
            'recent_sessions' => GameSession::with('compilation')->latest()->limit(8)->get(),
        ]);
    }
}
