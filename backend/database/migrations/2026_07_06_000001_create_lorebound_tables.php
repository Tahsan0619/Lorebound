<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sample_chapters', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('topic')->nullable();
            $table->string('category'); // Timeline, Process, CauseEffect, Comparison
            $table->string('structure_type');
            $table->longText('original_text');
            $table->json('payload');
            $table->json('metadata')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('compilations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('source_title');
            $table->longText('source_text');
            $table->enum('input_type', ['text', 'pdf', 'sample'])->default('text');
            $table->string('category');
            $table->string('mechanic_template');
            $table->json('classification');
            $table->json('metadata')->nullable();
            $table->json('payload');
            $table->string('model_used')->nullable();
            $table->unsignedInteger('tokens_processed')->default(0);
            $table->unsignedInteger('compilation_time_ms')->default(0);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('completed');
            $table->timestamps();
        });

        Schema::create('game_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compilation_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('score')->default(0);
            $table->unsignedTinyInteger('accuracy')->default(0);
            $table->unsignedInteger('time_elapsed')->default(0);
            $table->string('grade', 4)->nullable();
            $table->json('mistakes')->nullable();
            $table->string('session_token')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('compiler_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compiler_settings');
        Schema::dropIfExists('game_sessions');
        Schema::dropIfExists('compilations');
        Schema::dropIfExists('sample_chapters');
    }
};
