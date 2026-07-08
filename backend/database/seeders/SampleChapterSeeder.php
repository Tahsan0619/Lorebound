<?php

namespace Database\Seeders;

use App\Models\SampleChapter;
use App\Services\Compiler\AssessmentBuilderService;
use App\Services\Compiler\LearningGuideBuilderService;
use App\Services\Compiler\TextSanitizer;
use Illuminate\Database\Seeder;

class SampleChapterSeeder extends Seeder
{
    public function run(): void
    {
        $demosPath = database_path('seeders/data/demos.php');
        $jsonPath = database_path('seeders/data/samples.json');

        $samples = [];
        if (is_file($demosPath)) {
            $loaded = require $demosPath;
            if (is_array($loaded) && $loaded !== []) {
                $samples = $loaded;
            }
        }

        if ($samples === [] && is_file($jsonPath)) {
            $samples = json_decode(file_get_contents($jsonPath), true, 512, JSON_THROW_ON_ERROR);
        }

        if (! is_array($samples) || $samples === []) {
            return;
        }

        /** @var LearningGuideBuilderService $guideBuilder */
        $guideBuilder = app(LearningGuideBuilderService::class);
        /** @var AssessmentBuilderService $assessmentBuilder */
        $assessmentBuilder = app(AssessmentBuilderService::class);

        $slugs = array_column($samples, 'slug');
        SampleChapter::whereNotIn('slug', $slugs)->delete();

        foreach ($samples as $index => $sample) {
            $metadata = TextSanitizer::deep($sample['metadata'] ?? []);
            $payload = TextSanitizer::deep($sample['payload'] ?? []);
            $originalText = TextSanitizer::text((string) ($sample['original_text'] ?? ''));

            if (empty($metadata['learningGuide'])) {
                $metadata['learningGuide'] = $guideBuilder->fromPayload(
                    (string) $sample['title'],
                    $originalText,
                    (string) $sample['category'],
                    is_array($payload) ? $payload : [],
                    'deep',
                );
            }

            if (empty($metadata['assessments'])) {
                $subtopics = $metadata['learningGuide']['subtopics'] ?? [];
                $metadata['assessments'] = $assessmentBuilder->fromSubtopics(
                    (string) $sample['title'],
                    (string) $sample['category'],
                    is_array($subtopics) ? $subtopics : [],
                    $originalText,
                );
            }

            $metadata = TextSanitizer::deep($metadata);

            SampleChapter::updateOrCreate(
                ['slug' => $sample['slug']],
                [
                    'title' => TextSanitizer::text((string) $sample['title']),
                    'topic' => TextSanitizer::text((string) $sample['topic']),
                    'category' => $sample['category'],
                    'structure_type' => TextSanitizer::text((string) $sample['structure_type']),
                    'original_text' => $originalText,
                    'payload' => $payload,
                    'metadata' => $metadata,
                    'is_active' => true,
                    'sort_order' => $index + 1,
                ]
            );
        }
    }
}
