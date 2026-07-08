<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Lorebound</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Outfit:wght@700&display=swap" rel="stylesheet">
    <style>
        body { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#07080e; color:#f5f6fa; font-family:Inter,sans-serif; }
        .box { width:100%; max-width:400px; background:rgba(15,17,26,.9); border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:2rem; }
        h1 { font-family:Outfit,sans-serif; color:#00f2fe; margin-bottom:.5rem; }
        p { color:#a0aec0; font-size:.875rem; margin-bottom:1.5rem; }
        label { display:block; font-size:.8rem; color:#a0aec0; margin-bottom:.35rem; }
        input { width:100%; padding:.75rem; margin-bottom:1rem; border-radius:8px; border:1px solid rgba(255,255,255,.1); background:#0a0c12; color:#fff; }
        button { width:100%; padding:.85rem; border:none; border-radius:8px; background:linear-gradient(135deg,#00f2fe,#9b51e0); font-weight:700; cursor:pointer; }
        .error { background:rgba(255,23,68,.1); border:1px solid rgba(255,23,68,.2); color:#ff6b81; padding:.75rem; border-radius:8px; margin-bottom:1rem; font-size:.875rem; }
    </style>
</head>
<body>
<div class="box">
    <h1>Lorebound Admin</h1>
    <p>Sign in to manage samples, compilations, and sessions.</p>
    @if($errors->any())
        <div class="error">{{ $errors->first() }}</div>
    @endif
    <form method="POST" action="{{ route('admin.login.submit') }}">
        @csrf
        <label>Email</label>
        <input type="email" name="email" value="{{ old('email', 'admin@gmail.com') }}" required>
        <label>Password</label>
        <input type="password" name="password" value="admin000" required>
        <button type="submit">Sign In</button>
    </form>
</div>
</body>
</html>
