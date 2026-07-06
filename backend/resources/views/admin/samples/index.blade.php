@extends('admin.layout')
@section('title', 'Sample Chapters')
@section('content')
<div class="topbar">
    <h2>Sample Chapters</h2>
    <a href="{{ route('admin.samples.create') }}" class="btn">Add Sample</a>
</div>
<div class="card">
    <table>
        <thead><tr><th>#</th><th>Title</th><th>Category</th><th>Active</th><th>Actions</th></tr></thead>
        <tbody>
        @foreach($samples as $sample)
            <tr>
                <td>{{ $sample->sort_order }}</td>
                <td>{{ $sample->title }}</td>
                <td><span class="badge">{{ $sample->category }}</span></td>
                <td>{{ $sample->is_active ? 'Yes' : 'No' }}</td>
                <td>
                    <a href="{{ route('admin.samples.edit', $sample) }}" class="btn btn-secondary">Edit</a>
                    <form action="{{ route('admin.samples.destroy', $sample) }}" method="POST" style="display:inline" onsubmit="return confirm('Delete?')">
                        @csrf @method('DELETE')
                        <button class="btn btn-danger">Delete</button>
                    </form>
                </td>
            </tr>
        @endforeach
        </tbody>
    </table>
    {{ $samples->links() }}
</div>
@endsection
