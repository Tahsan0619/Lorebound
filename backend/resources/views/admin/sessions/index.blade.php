@extends('admin.layout')
@section('title', 'Game Sessions')
@section('content')
<div class="topbar"><h2>Game Sessions</h2></div>
<div class="card">
    <div class="admin-table-wrap">
        <table class="admin-table">
            <thead>
                <tr>
                    <th class="col-title">Compilation</th>
                    <th class="col-score">Score</th>
                    <th class="col-accuracy">Accuracy</th>
                    <th class="col-grade">Grade</th>
                    <th class="col-time">Time</th>
                    <th class="col-date">Completed</th>
                </tr>
            </thead>
            <tbody>
            @forelse($sessions as $s)
                <tr>
                    <td class="col-title" title="{{ $s->compilation?->source_title ?? '-' }}">
                        {{ $s->compilation?->source_title ?? '-' }}
                    </td>
                    <td class="col-score">{{ number_format($s->score) }}</td>
                    <td class="col-accuracy">{{ $s->accuracy }}%</td>
                    <td class="col-grade">{{ $s->grade ?? '-' }}</td>
                    <td class="col-time">{{ gmdate('i:s', $s->time_elapsed) }}</td>
                    <td class="col-date">{{ $s->completed_at?->diffForHumans() ?? '-' }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="admin-empty">No game sessions recorded yet.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    <div class="admin-pagination">{{ $sessions->links() }}</div>
</div>
@endsection
