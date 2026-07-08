@extends('admin.layout')
@section('title', 'Dashboard')
@section('content')
<div class="topbar"><h2>Dashboard</h2></div>
<div class="stats">
    <div class="card stat"><h3>Sample Chapters</h3><p>{{ $stats['samples'] }}</p></div>
    <div class="card stat"><h3>User Games</h3><p>{{ $stats['compilations'] }}</p></div>
    <div class="card stat"><h3>Game Sessions</h3><p>{{ $stats['sessions'] }}</p></div>
    <div class="card stat"><h3>Today</h3><p>{{ $stats['today_compilations'] }}</p></div>
</div>
@if($stats['sample_logs'] > 0)
    <div class="alert alert-error" style="display:flex; justify-content:space-between; align-items:center; gap:1rem;">
        <span>{{ $stats['sample_logs'] }} duplicate sample play log(s) from older versions. Safe to purge.</span>
        <form action="{{ route('admin.compilations.purge-sample-logs') }}" method="POST" onsubmit="return confirm('Purge all sample play logs?')">
            @csrf
            <button type="submit" class="btn btn-danger" style="white-space:nowrap;">Purge logs</button>
        </form>
    </div>
@endif
<div class="card">
    <h3 style="margin-bottom:1rem;">Recent Compilations</h3>
    <table>
        <thead><tr><th>Title</th><th>Category</th><th>Input</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
        @forelse($recent_compilations as $c)
            <tr>
                <td><a href="{{ route('admin.compilations.show', $c) }}" style="color:var(--cyan)">{{ $c->source_title }}</a></td>
                <td><span class="badge">{{ $c->category }}</span></td>
                <td>{{ $c->input_type }}</td>
                <td>{{ $c->created_at->diffForHumans() }}</td>
                <td>
                    @if($c->isUserCompiled())
                        <form action="{{ route('admin.compilations.destroy', $c) }}" method="POST" style="display:inline" onsubmit="return confirm('Delete this compiled game?')">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="btn btn-danger" style="padding:.35rem .65rem; font-size:.75rem;">Delete</button>
                        </form>
                    @else
                        <span style="color:var(--muted); font-size:.75rem;">N/A</span>
                    @endif
                </td>
            </tr>
        @empty
            <tr><td colspan="5">No compilations yet.</td></tr>
        @endforelse
        </tbody>
    </table>
</div>
@endsection
