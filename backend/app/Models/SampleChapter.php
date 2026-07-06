<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SampleChapter extends Model
{
    protected $fillable = [
        'slug', 'title', 'topic', 'category', 'structure_type',
        'original_text', 'payload', 'metadata', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'metadata' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
