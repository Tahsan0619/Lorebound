<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Admin') — Lorebound</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700&display=swap" rel="stylesheet">
    <style>
        :root { --bg:#0e1017; --panel:#151822; --border:rgba(255,255,255,.08); --cyan:#00f2fe; --text:#f5f6fa; --muted:#a0aec0; }
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:Inter,sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }
        .layout { display:grid; grid-template-columns:240px 1fr; min-height:100vh; }
        aside { background:var(--panel); border-right:1px solid var(--border); padding:1.5rem 1rem; }
        aside h1 { font-family:Outfit,sans-serif; font-size:1.2rem; margin-bottom:1.5rem; color:var(--cyan); }
        nav a { display:block; padding:.65rem .85rem; color:var(--muted); text-decoration:none; border-radius:8px; margin-bottom:.25rem; font-size:.9rem; }
        nav a:hover, nav a.active { background:rgba(0,242,254,.08); color:var(--cyan); }
        main { padding:2rem; }
        .topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
        .card { background:var(--panel); border:1px solid var(--border); border-radius:12px; padding:1.25rem; margin-bottom:1rem; }
        .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
        .stat h3 { font-size:.75rem; color:var(--muted); text-transform:uppercase; }
        .stat p { font-size:1.75rem; font-weight:700; font-family:Outfit,sans-serif; color:var(--cyan); }
        table { width:100%; border-collapse:collapse; font-size:.875rem; }
        th, td { text-align:left; padding:.75rem; border-bottom:1px solid var(--border); }
        th { color:var(--muted); font-weight:600; }
        .btn { display:inline-block; padding:.55rem 1rem; border-radius:8px; background:linear-gradient(135deg,#00f2fe,#9b51e0); color:#000; font-weight:600; text-decoration:none; border:none; cursor:pointer; font-size:.875rem; }
        .btn-secondary { background:rgba(255,255,255,.06); color:var(--text); border:1px solid var(--border); }
        .btn-danger { background:rgba(255,23,68,.15); color:#ff6b81; }
        .alert { padding:.75rem 1rem; border-radius:8px; margin-bottom:1rem; background:rgba(0,230,118,.1); border:1px solid rgba(0,230,118,.2); color:#00e676; }
        .alert-error { background:rgba(255,23,68,.1); border-color:rgba(255,23,68,.2); color:#ff6b81; }
        form label { display:block; font-size:.8rem; color:var(--muted); margin:.75rem 0 .35rem; }
        form input, form select, form textarea { width:100%; padding:.65rem; border-radius:8px; border:1px solid var(--border); background:#0a0c12; color:var(--text); font-family:inherit; }
        form textarea { min-height:120px; font-family:monospace; font-size:.8rem; }
        .badge { padding:.2rem .5rem; border-radius:4px; font-size:.7rem; font-weight:700; background:rgba(0,242,254,.1); color:var(--cyan); }
        @media(max-width:900px){ .layout{grid-template-columns:1fr;} aside{display:flex;flex-wrap:wrap;gap:.5rem;} .stats{grid-template-columns:1fr 1fr;} }
    </style>
</head>
<body>
<div class="layout">
    <aside>
        <h1>Lorebound Admin</h1>
        <nav>
            <a href="{{ route('admin.dashboard') }}" class="{{ request()->routeIs('admin.dashboard') ? 'active' : '' }}">Dashboard</a>
            <a href="{{ route('admin.samples.index') }}" class="{{ request()->routeIs('admin.samples.*') ? 'active' : '' }}">Sample Chapters</a>
            <a href="{{ route('admin.compilations.index') }}" class="{{ request()->routeIs('admin.compilations.*') ? 'active' : '' }}">Compilations</a>
            <a href="{{ route('admin.sessions.index') }}" class="{{ request()->routeIs('admin.sessions.*') ? 'active' : '' }}">Game Sessions</a>
            <a href="/app/" target="_blank">Open Frontend</a>
            <form action="{{ route('admin.logout') }}" method="POST" style="margin-top:1rem;">
                @csrf
                <button type="submit" class="btn btn-secondary" style="width:100%;">Logout</button>
            </form>
        </nav>
    </aside>
    <main>
        @if(session('success'))
            <div class="alert">{{ session('success') }}</div>
        @endif
        @yield('content')
    </main>
</div>
</body>
</html>
