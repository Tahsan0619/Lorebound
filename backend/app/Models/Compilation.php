<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Compilation extends Model
{
    protected $fillable = [
        'uuid', 'source_title', 'source_text', 'input_type', 'category',
        'mechanic_template', 'classification', 'metadata', 'payload',
        'model_used', 'tokens_processed', 'compilation_time_ms', 'status',
    ];

    protected function casts(): array
    {
        return [
            'classification' => 'array',
            'metadata' => 'array',
            'payload' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Compilation $compilation) {
            if (empty($compilation->uuid)) {
                $compilation->uuid = (string) Str::uuid();
            }
        });
    }

    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }

    public function isUserCompiled(): bool
    {
        return in_array($this->input_type, ['text', 'pdf'], true);
    }

    public function scopeUserCompiled($query)
    {
        return $query->whereIn('input_type', ['text', 'pdf']);
    }
}
