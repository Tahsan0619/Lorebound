@extends('admin.layout')
@section('title', 'Compilations')
@section('content')
<div class="topbar"><h2>Compilations</h2></div>
<div class="card">
    <table>
        <thead><tr><th>Title</th><th>Category</th><th>Mechanic</th><th>Tokens</th><th>Date</th></tr></thead>
        <tbody>
        @foreach($compilations as $c)
            <tr>
                <td><a href="{{ route('admin.compilations.show', $c) }}" style="color:var(--cyan)">{{ $c->source_title }}</a></td>
                <td><span class="badge">{{ $c->category }}</span></td>
                <td>{{ $c->mechanic_template }}</td>
                <td>{{ $c->tokens_processed }}</td>
                <td>{{ $c->created_at->format('M j, Y H:i') }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
    {{ $compilations->links() }}
</div>
@endsection
