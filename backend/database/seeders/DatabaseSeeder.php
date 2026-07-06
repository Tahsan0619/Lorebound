<?php

namespace Database\Seeders;

use App\Models\SampleChapter;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@lorebound.test'],
            [
                'name' => 'Lorebound Admin',
                'password' => Hash::make('password'),
            ]
        );

        $this->call(SampleChapterSeeder::class);
    }
}
