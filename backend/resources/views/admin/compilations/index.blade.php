@extends('admin.layout')
@section('title', 'Compilations')
@section('content')
<div class="topbar">
    <h2>System Admin</h2>
    @if($sample_log_count > 0)
        <form action="{{ route('admin.compilations.purge-sample-logs') }}" method="POST" onsubmit="return confirm('Remove {{ $sample_log_count }} old sample play log(s)? These were duplicate entries from launching built-in games.')">
            @csrf
            <button type="submit" class="btn btn-danger">Purge {{ $sample_log_count }} sample log(s)</button>
        </form>
    @endif
</div>
<p style="color:var(--muted); font-size:.875rem; margin:-.75rem 0 1.25rem;">
    Monitor and inspect AI-compiled modules. Select a row to see preview details on the right.
</p>
<div class="admin-metrics-grid">
    <div class="admin-metric-card">
        <div class="admin-metric-left">
            <div class="admin-metric-label">Total Compilations</div>
            <div class="admin-metric-value">{{ number_format($metrics['total_compilations']) }}</div>
        </div>
        <div class="admin-metric-icon"><i class="fa-solid fa-layer-group"></i></div>
    </div>

    <div class="admin-metric-card">
        <div class="admin-metric-left">
            <div class="admin-metric-label">Success Rate</div>
            <div class="admin-metric-value">{{ number_format((float) $metrics['success_rate'], 1) }}%</div>
        </div>
        <div class="admin-metric-icon"><i class="fa-solid fa-badge-check"></i></div>
    </div>

    <div class="admin-metric-card">
        <div class="admin-metric-left">
            <div class="admin-metric-label">Active Models</div>
            <div class="admin-metric-value">{{ number_format($metrics['active_models']) }}</div>
        </div>
        <div class="admin-metric-icon"><i class="fa-solid fa-microchip"></i></div>
    </div>

    <div class="admin-metric-card">
        <div class="admin-metric-left">
            <div class="admin-metric-label">Avg. Pipeline Time</div>
            <div class="admin-metric-value">{{ number_format($metrics['avg_pipeline_seconds']) }}s</div>
        </div>
        <div class="admin-metric-icon"><i class="fa-solid fa-clock"></i></div>
    </div>
</div>

<div class="admin-tools-row">
    <div class="admin-search">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Search by topic or ID (UI only)" disabled>
    </div>

    <div class="admin-filter-group">
        <span class="admin-filter-pill active">Model: All</span>
        <span class="admin-filter-pill">Last 7 Days</span>
    </div>
</div>

<div class="admin-compilations-shell">
    <div class="card">
    <table class="admin-table">
        <thead>
            <tr>
                <th>Topic / Subject</th>
                <th>Mechanic</th>
                <th>Foundation Model</th>
                <th>Status</th>
                <th>Last Compile</th>
            </tr>
        </thead>
        <tbody>
        @forelse($compilations as $c)
            @php $isSelected = $selectedCompilation && $c->id === $selectedCompilation->id; @endphp
            <tr class="{{ $isSelected ? 'admin-row-selected' : '' }}">
                <td>
                    <a href="{{ route('admin.compilations.index') }}?selected={{ $c->uuid }}" class="admin-row-link">
                        {{ $c->source_title }}
                    </a>
                </td>
                <td>{{ $c->mechanic_template }}</td>
                <td>{{ $c->model_used ?? 'N/A' }}</td>
                <td><span class="admin-badge">{{ $c->status ?? 'N/A' }}</span></td>
                <td>{{ $c->created_at->format('Y-m-d') }}</td>
            </tr>
        @empty
            <tr><td colspan="5">No user-compiled games yet. Compile from the frontend to add one.</td></tr>
        @endforelse
        </tbody>
    </table>
        {{ !empty($selectedUuid) ? $compilations->appends(['selected' => $selectedUuid])->links() : $compilations->links() }}
</div>

<aside class="admin-detail-panel">
    <div class="admin-detail-head">
        <div class="admin-detail-title">
            {{ $selectedCompilation ? 'Mechanic Insight' : 'Select a compilation' }}
        </div>
    </div>

    <div class="admin-detail-body">
        @if($selectedCompilation)
            <div class="admin-detail-card">
                <h4>Mechanic</h4>
                <div class="admin-badge"><i class="fa-solid fa-diagram-project"></i> {{ $selectedCompilation->mechanic_template }}</div>
            </div>

            <div class="admin-detail-card">
                <h4>Foundation Model</h4>
                <div style="color:var(--text-primary); font-weight:700;">
                    {{ $selectedCompilation->model_used ?? 'N/A' }}
                </div>
            </div>

            <div class="admin-detail-card">
                <h4>Classification (preview)</h4>
                <pre>{{ json_encode($selectedCompilation->classification, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</pre>
            </div>

            <div class="admin-detail-card">
                <h4>Theme (preview)</h4>
                <pre>{{ json_encode($selectedCompilation->metadata['theme'] ?? null, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</pre>
            </div>

            <div style="display:flex; gap:.7rem; flex-wrap:wrap;">
                <a class="btn btn-secondary" href="{{ route('admin.compilations.show', $selectedCompilation) }}">
                    View Details
                </a>
                <a class="btn btn-primary" href="/app/" target="_blank" rel="noreferrer noopener">
                    Play Test
                </a>
            </div>
        @else
            <div class="admin-detail-card">
                <h4>Mechanic Insight</h4>
                <div style="color:var(--text-secondary);">Pick a row from the table.</div>
            </div>
        @endif
    </div>
</aside>
</div>
@endsection
