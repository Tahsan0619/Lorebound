<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Admin') - Lorebound</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/app/styles.css">
    <link rel="stylesheet" href="/app/admin.css">
</head>
<body>
<div class="layout">
    <aside>
        <h1>Lorebound</h1>
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
        @if(session('error'))
            <div class="alert alert-error">{{ session('error') }}</div>
        @endif
        @yield('content')
    </main>
</div>
</body>
</html>
