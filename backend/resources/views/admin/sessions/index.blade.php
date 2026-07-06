@extends('admin.layout')
@section('title', 'Game Sessions')
@section('content')
<div class="topbar"><h2>Game Sessions</h2></div>
<div class="card">
    <table>
        <thead><tr><th>Compilation</th><th>Score</th><th>Accuracy</th><th>Grade</th><th>Time</th><th>Completed</th></tr></thead>
        <tbody>
        @foreach($sessions as $s)
            <tr>
                <td>{{ $s->compilation?->source_title ?? '—' }}</td>
                <td>{{ number_format($s->score) }}</td>
                <td>{{ $s->accuracy }}%</td>
                <td>{{ $s->grade ?? '—' }}</td>
                <td>{{ gmdate('i:s', $s->time_elapsed) }}</td>
                <td>{{ $s->completed_at?->diffForHumans() ?? '—' }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
    {{ $sessions->links() }}
</div>
@endsection
