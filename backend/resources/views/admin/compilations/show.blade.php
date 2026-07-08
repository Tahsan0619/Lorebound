@extends('admin.layout')
@section('title', 'Compilation Detail')
@section('content')
<div class="topbar">
    <h2>{{ $compilation->source_title }}</h2>
    <div style="display:flex; gap:.5rem;">
        <a href="{{ route('admin.compilations.index') }}" class="btn btn-secondary">Back to list</a>
        @if($compilation->isUserCompiled())
            <form action="{{ route('admin.compilations.destroy', $compilation) }}" method="POST" onsubmit="return confirm('Delete this compiled game? It will be removed from the frontend library.')">
                @csrf
                @method('DELETE')
                <button type="submit" class="btn btn-danger">Delete game</button>
            </form>
        @endif
    </div>
</div>
<div class="card">
    <p><strong>UUID:</strong> {{ $compilation->uuid }}</p>
    <p><strong>Category:</strong> {{ $compilation->category }}</p>
    <p><strong>Mechanic:</strong> {{ $compilation->mechanic_template }}</p>
    <p><strong>Input:</strong> {{ $compilation->input_type }}@if($compilation->isUserCompiled()) <span style="color:#bb86fc; font-size:.8rem;">(user library)</span>@endif</p>
    <p><strong>Model:</strong> {{ $compilation->model_used ?? 'N/A' }}</p>
    <p><strong>Compilation Time:</strong> {{ $compilation->compilation_time_ms }}ms</p>
    <p><strong>Created:</strong> {{ $compilation->created_at->format('M j, Y H:i') }}</p>
</div>
<div class="card">
    <h3 style="margin-bottom:.75rem;">Classification</h3>
    <pre style="font-size:.75rem; overflow:auto; color:var(--muted);">{{ json_encode($compilation->classification, JSON_PRETTY_PRINT) }}</pre>
</div>
<div class="card">
    <h3 style="margin-bottom:.75rem;">Source Text</h3>
    <p style="font-size:.875rem; line-height:1.6; color:var(--muted);">{{ Str::limit($compilation->source_text, 2000) }}</p>
</div>
@endsection
