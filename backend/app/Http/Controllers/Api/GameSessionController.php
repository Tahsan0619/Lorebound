<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compilation;
use App\Models\GameSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GameSessionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'compilation_uuid' => 'nullable|uuid|exists:compilations,uuid',
            'score' => 'required|integer|min:0',
            'accuracy' => 'required|integer|min:0|max:100',
            'time_elapsed' => 'required|integer|min:0',
            'grade' => 'nullable|string|max:4',
            'mistakes' => 'nullable|array',
        ]);

        $compilationId = null;
        if (! empty($validated['compilation_uuid'])) {
            $compilationId = Compilation::where('uuid', $validated['compilation_uuid'])->value('id');
        }

        $session = GameSession::create([
            'compilation_id' => $compilationId,
            'score' => $validated['score'],
            'accuracy' => $validated['accuracy'],
            'time_elapsed' => $validated['time_elapsed'],
            'grade' => $validated['grade'] ?? null,
            'mistakes' => $validated['mistakes'] ?? [],
            'session_token' => $request->header('X-Session-Token'),
            'completed_at' => now(),
        ]);

        return response()->json(['id' => $session->id, 'message' => 'Session saved'], 201);
    }
}
