<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameSession extends Model
{
    protected $fillable = [
        'compilation_id', 'score', 'accuracy', 'time_elapsed',
        'grade', 'mistakes', 'session_token', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'mistakes' => 'array',
            'completed_at' => 'datetime',
        ];
    }

    public function compilation(): BelongsTo
    {
        return $this->belongsTo(Compilation::class);
    }
}
