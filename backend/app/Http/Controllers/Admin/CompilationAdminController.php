<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Compilation;
use Illuminate\View\View;

class CompilationAdminController extends Controller
{
    public function index(): View
    {
        return view('admin.compilations.index', [
            'compilations' => Compilation::latest()->paginate(20),
        ]);
    }

    public function show(Compilation $compilation): View
    {
        return view('admin.compilations.show', compact('compilation'));
    }
}
