<?php

use App\Http\Controllers\Api\CompileController;
use App\Http\Controllers\Api\GameSessionController;
use App\Http\Controllers\Api\SampleChapterController;
use App\Models\SampleChapter;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json(['status' => 'ok', 'service' => 'Lorebound API']));

    Route::get('/samples', [SampleChapterController::class, 'index']);
    Route::get('/samples/{slug}', [SampleChapterController::class, 'show']);

    Route::post('/compile', [CompileController::class, 'compileText']);
    Route::post('/compile/pdf', [CompileController::class, 'compilePdf']);
    Route::get('/compilations/{uuid}', [CompileController::class, 'show']);

    Route::post('/sessions', [GameSessionController::class, 'store']);
    Route::post('/samples/{slug}/compile', function (string $slug, CompileController $controller) {
        $sample = SampleChapter::where('slug', $slug)->firstOrFail();

        return $controller->fromSample($sample);
    });
});
