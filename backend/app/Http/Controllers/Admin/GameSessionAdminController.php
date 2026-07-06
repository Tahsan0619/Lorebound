<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GameSession;
use Illuminate\View\View;

class GameSessionAdminController extends Controller
{
    public function index(): View
    {
        return view('admin.sessions.index', [
            'sessions' => GameSession::with('compilation')->latest()->paginate(20),
        ]);
    }
}
