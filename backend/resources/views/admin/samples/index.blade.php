@extends('admin.layout')
@section('title', 'Sample Chapters')
@section('content')
<div class="topbar">
    <h2>Sample Chapters</h2>
    <a href="{{ route('admin.samples.create') }}" class="btn btn-primary btn-sm">Add Sample</a>
</div>
<div class="card">
    <div class="admin-table-wrap">
        <table class="admin-table">
            <thead>
                <tr>
                    <th class="col-num">#</th>
                    <th class="col-title">Title</th>
                    <th class="col-category">Category</th>
                    <th class="col-active">Active</th>
                    <th class="col-actions">Actions</th>
                </tr>
            </thead>
            <tbody>
            @foreach($samples as $sample)
                <tr>
                    <td class="col-num">{{ $sample->sort_order }}</td>
                    <td class="col-title" title="{{ $sample->title }}">{{ $sample->title }}</td>
                    <td class="col-category"><span class="admin-badge">{{ $sample->category }}</span></td>
                    <td class="col-active">{{ $sample->is_active ? 'Yes' : 'No' }}</td>
                    <td class="col-actions">
                        <div class="admin-actions">
                            <a href="{{ route('admin.samples.edit', $sample) }}" class="btn btn-secondary btn-sm">Edit</a>
                            <form action="{{ route('admin.samples.destroy', $sample) }}" method="POST" onsubmit="return confirm('Delete?')">
                                @csrf @method('DELETE')
                                <button type="submit" class="btn btn-danger btn-sm">Delete</button>
                            </form>
                        </div>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
    <div class="admin-pagination">{{ $samples->links() }}</div>
</div>
@endsection
