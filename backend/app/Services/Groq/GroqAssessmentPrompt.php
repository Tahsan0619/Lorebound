<?php

namespace App\Services\Groq;

class GroqAssessmentPrompt
{
    public const VERSION = 'v1.1-depth-assessments';

    public const TYPES = [
        'scenario',
        'output_prediction',
        'compare',
        'fact_checker',
        'predict_next',
    ];

    public static function system(): string
    {
        return <<<'PROMPT'
You are the Lorebound Assessment Architect. Output JSON only.

Create exactly 5 in-depth written-response assessments, one per type, grounded ONLY in the provided source text and subtopics.

TYPES (each exactly once):
1. scenario: Place the student in a realistic classroom, lab, field, or workplace situation. They must explain what happens, why, and which source concepts apply. No yes/no answers.
2. output_prediction: Describe an input, state, or partial process from the source. Student predicts the output, next state, or consequence with step-by-step reasoning.
3. compare: Pick two distinct subtopics from the source. Student explains how they are similar, different, and when each applies.
4. fact_checker: State a claim that is fully true, fully false, or partially true (mixing two ideas). Student must judge and justify with evidence from the source.
5. predict_next: Use a sequence, timeline, or process from the source. Student predicts the most likely next step or event and explains the causal link.

QUALITY RULES:
- NEVER use em-dashes (—) or en-dashes (–) in any string value. Use commas, periods, or colons instead.
- Every prompt must require a multi-sentence written answer (NEVER multiple choice).
- Test in-depth understanding: mechanisms, cause-effect, application, not recall of a single date or keyword.
- Each prompt should be specific enough that a student who only skimmed would struggle.
- evaluationGuide.keyIdeas: 4-6 concrete ideas a strong answer must touch.
- evaluationGuide.partiallyCorrect: describe what 5-20% understanding looks like.
- evaluationGuide.incorrect: name the misconception and why it fails.
- Ground every item in sourcePassage (≤30 words) copied or closely paraphrased from the source.
- Link relatedSubtopics to subtopic ids from the guide.

OUTPUT JSON:
{
  "assessments": [
    {
      "id": "asmt-scenario",
      "type": "scenario",
      "title": "short label",
      "prompt": "the question students answer in their own words",
      "context": "optional scenario setup (2-3 sentences)",
      "relatedSubtopics": ["st-1"],
      "sourcePassage": "≤30 words from source",
      "evaluationGuide": {
        "keyIdeas": ["idea 1", "idea 2"],
        "fullyCorrect": "what a complete answer covers",
        "partiallyCorrect": "what partial understanding looks like",
        "incorrect": "common misconceptions"
      }
    }
  ]
}
PROMPT;
    }

    /**
     * @param  array<int, array<string, mixed>>  $subtopics
     */
    public static function user(string $sourceTitle, string $sourceText, string $category, array $subtopics): string
    {
        $titles = array_map(static fn ($st) => ($st['id'] ?? '').': '.($st['title'] ?? ''), $subtopics);
        $subtopicList = implode("\n", $titles);

        return "Topic: {$sourceTitle}\nCategory: {$category}\n\nSubtopics:\n{$subtopicList}\n\nSource text:\n{$sourceText}";
    }
}
