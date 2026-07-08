@extends('admin.layout')
@section('title', 'Dashboard')
@section('content')
<div class="topbar"><h2>Dashboard</h2></div>

<div class="admin-metrics-grid">
    <div class="admin-metric-card">
        <div class="admin-metric-left">
            <div class="admin-metric-label">Sample Chapters</div>
            <div class="admin-metric-value">{{ $stats['samples'] }}</div>
        </div>
        <div class="admin-metric-icon"><i class="fa-solid fa-book"></i></div>
    </div>
    <div class="admin-metric-card">
        <div class="admin-metric-left">
            <div class="admin-metric-label">User Games</div>
            <div class="admin-metric-value">{{ $stats['compilations'] }}</div>
        </div>
        <div class="admin-metric-icon"><i class="fa-solid fa-gamepad"></i></div>
    </div>
    <div class="admin-metric-card">
        <div class="admin-metric-left">
            <div class="admin-metric-label">Game Sessions</div>
            <div class="admin-metric-value">{{ $stats['sessions'] }}</div>
        </div>
        <div class="admin-metric-icon"><i class="fa-solid fa-chart-line"></i></div>
    </div>
    <div class="admin-metric-card">
        <div class="admin-metric-left">
            <div class="admin-metric-label">Today</div>
            <div class="admin-metric-value">{{ $stats['today_compilations'] }}</div>
        </div>
        <div class="admin-metric-icon"><i class="fa-solid fa-calendar-day"></i></div>
    </div>
</div>

@if($stats['sample_logs'] > 0)
    <div class="alert alert-error admin-alert-row">
        <span>{{ $stats['sample_logs'] }} duplicate sample play log(s) from older versions. Safe to purge.</span>
        <form action="{{ route('admin.compilations.purge-sample-logs') }}" method="POST" onsubmit="return confirm('Purge all sample play logs?')">
            @csrf
            <button type="submit" class="btn btn-danger btn-sm">Purge logs</button>
        </form>
    </div>
@endif

<div class="card">
    <h3 class="admin-section-title">Recent Compilations</h3>
    <div class="admin-table-wrap">
        <table class="admin-table">
            <thead>
                <tr>
                    <th class="col-title">Title</th>
                    <th class="col-category">Category</th>
                    <th class="col-input">Input</th>
                    <th class="col-date">Date</th>
                    <th class="col-actions">Actions</th>
                </tr>
            </thead>
            <tbody>
            @forelse($recent_compilations as $c)
                <tr>
                    <td class="col-title">
                        <a href="{{ route('admin.compilations.show', $c) }}" class="admin-table-link" title="{{ $c->source_title }}">
                            {{ $c->source_title }}
                        </a>
                    </td>
                    <td class="col-category"><span class="admin-badge">{{ $c->category }}</span></td>
                    <td class="col-input">{{ $c->input_type }}</td>
                    <td class="col-date">{{ $c->created_at->diffForHumans() }}</td>
                    <td class="col-actions">
                        <div class="admin-actions">
                            @if($c->isUserCompiled())
                                <form action="{{ route('admin.compilations.destroy', $c) }}" method="POST" onsubmit="return confirm('Delete this compiled game?')">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="btn btn-danger btn-sm">Delete</button>
                                </form>
                            @else
                                <span class="admin-muted">N/A</span>
                            @endif
                        </div>
                    </td>
                </tr>
            @empty
                <tr><td colspan="5" class="admin-empty">No compilations yet.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection
