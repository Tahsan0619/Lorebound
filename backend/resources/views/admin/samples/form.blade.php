@extends('admin.layout')
@section('title', $sample->exists ? 'Edit Sample' : 'New Sample')
@section('content')
<div class="topbar"><h2>{{ $sample->exists ? 'Edit' : 'Create' }} Sample Chapter</h2></div>
<div class="card">
    <form method="POST" action="{{ $sample->exists ? route('admin.samples.update', $sample) : route('admin.samples.store') }}">
        @csrf
        @if($sample->exists) @method('PUT') @endif
        <label>Slug</label>
        <input name="slug" value="{{ old('slug', $sample->slug) }}" required>
        <label>Title</label>
        <input name="title" value="{{ old('title', $sample->title) }}" required>
        <label>Topic</label>
        <input name="topic" value="{{ old('topic', $sample->topic) }}">
        <label>Category</label>
        <select name="category">
            @foreach(['Timeline','Process','CauseEffect','Comparison'] as $cat)
                <option value="{{ $cat }}" @selected(old('category', $sample->category) === $cat)>{{ $cat }}</option>
            @endforeach
        </select>
        <label>Structure Type</label>
        <input name="structure_type" value="{{ old('structure_type', $sample->structure_type) }}" required>
        <label>Original Text</label>
        <textarea name="original_text" required>{{ old('original_text', $sample->original_text) }}</textarea>
        <label>Payload (JSON)</label>
        <textarea name="payload" required>{{ old('payload', json_encode($sample->payload ?? [], JSON_PRETTY_PRINT)) }}</textarea>
        <label>Metadata (JSON)</label>
        <textarea name="metadata">{{ old('metadata', json_encode($sample->metadata ?? [], JSON_PRETTY_PRINT)) }}</textarea>
        <label>Sort Order</label>
        <input type="number" name="sort_order" value="{{ old('sort_order', $sample->sort_order ?? 0) }}">
        <label><input type="checkbox" name="is_active" value="1" @checked(old('is_active', $sample->is_active ?? true))> Active</label>
        <div style="margin-top:1rem;"><button class="btn" type="submit">Save</button></div>
    </form>
</div>
@endsection
