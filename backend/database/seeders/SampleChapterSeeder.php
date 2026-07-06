<?php

namespace Database\Seeders;

use App\Models\SampleChapter;
use Illuminate\Database\Seeder;

class SampleChapterSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/demos.php');
        if (! file_exists($path)) {
            $path = database_path('seeders/data/samples.json');
            if (! file_exists($path)) {
                return;
            }
            $samples = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        } else {
            $samples = require $path;
        }

        $slugs = array_column($samples, 'slug');
        SampleChapter::whereNotIn('slug', $slugs)->delete();

        foreach ($samples as $index => $sample) {
            SampleChapter::updateOrCreate(
                ['slug' => $sample['slug']],
                [
                    'title' => $sample['title'],
                    'topic' => $sample['topic'],
                    'category' => $sample['category'],
                    'structure_type' => $sample['structure_type'],
                    'original_text' => $sample['original_text'],
                    'payload' => $sample['payload'],
                    'metadata' => $sample['metadata'],
                    'is_active' => true,
                    'sort_order' => $index + 1,
                ]
            );
        }
    }
}
