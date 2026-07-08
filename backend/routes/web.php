<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\CompilationAdminController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\GameSessionAdminController;
use App\Http\Controllers\Admin\SampleChapterAdminController;
use App\Http\Controllers\Api\CompileController;
use App\Http\Controllers\Api\SampleChapterController as ApiSampleController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/app/');
});

Route::prefix('app')->group(function () {
    Route::get('/{path?}', function (?string $path = null) {
        $safe = str_replace(['..', '\\'], '', $path ?? 'index.html');
        if ($safe === '' || $safe === '/') {
            $safe = 'index.html';
        }
        $file = public_path('app/'.$safe);
        if (is_file($file)) {
            $ext = pathinfo($file, PATHINFO_EXTENSION);
            $mime = match ($ext) {
                'css' => 'text/css',
                'js' => 'application/javascript',
                'html' => 'text/html',
                default => 'application/octet-stream',
            };

            return response(file_get_contents($file), 200, ['Content-Type' => $mime]);
        }

        abort(404);
    })->where('path', '.*');
});

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->name('login.submit');

    Route::middleware('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
        Route::resource('samples', SampleChapterAdminController::class)->except(['show']);
        Route::get('compilations', [CompilationAdminController::class, 'index'])->name('compilations.index');
        Route::get('compilations/{compilation}', [CompilationAdminController::class, 'show'])->name('compilations.show');
        Route::delete('compilations/{compilation}', [CompilationAdminController::class, 'destroy'])->name('compilations.destroy');
        Route::post('compilations/purge-sample-logs', [CompilationAdminController::class, 'purgeSampleLogs'])->name('compilations.purge-sample-logs');
        Route::get('sessions', [GameSessionAdminController::class, 'index'])->name('sessions.index');
    });
});
