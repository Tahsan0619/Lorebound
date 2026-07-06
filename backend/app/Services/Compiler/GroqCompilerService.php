<?php

namespace App\Services\Compiler;

use App\Services\Groq\GroqClientService;

class GroqCompilerService
{
    public function __construct(private GroqClientService $groq) {}

    public function classify(string $text, ?string $model = null): ?array
    {
        $system = <<<'PROMPT'
You are Lorebound's expert structural classifier for curriculum content. Analyze the DOMINANT knowledge structure.

Return ONLY valid JSON:
{
  "category": "Timeline|Process|CauseEffect|Comparison",
  "structure_type": "human-readable label",
  "rationale": "2 sentences citing specific textual evidence",
  "confidence_matrix": {"seq":0-100,"cyc":0-100,"cau":0-100,"comp":0-100},
  "mechanic_template": "Timeline Builder|Process Loop|Cause-Effect Chain|Comparison Sorter"
}

Classification rules:
- Timeline: chronological events, dates, eras, "first/then/finally", historical sequences
- Process: cyclical or staged procedures, biological/physical systems, ordered steps that repeat or flow
- CauseEffect: explicit causal chains, "leads to", consequences, domino effects
- Comparison: contrasting two+ entities, "versus", "in contrast", attribute differences

Score ALL four dimensions in confidence_matrix (they should sum to roughly 100-200, with dominant type highest).
Never hallucinate content not in the text. Pick ONE dominant category.
PROMPT;

        $result = $this->groq->chatJson($system, "Classify this curriculum excerpt:\n\n".mb_substr($text, 0, 8000), $model);
        if (! $result || empty($result['category'])) {
            return null;
        }

        $category = match ($result['category']) {
            'Process', 'Cyclical', 'Cycle' => 'Process',
            'CauseEffect', 'Cause-Effect', 'Causal' => 'CauseEffect',
            'Comparison', 'Comparative' => 'Comparison',
            default => 'Timeline',
        };

        $matrix = $this->normalizeMatrix($result['confidence_matrix'] ?? [], $category);

        return [
            'category' => $category,
            'mechanic_template' => $result['mechanic_template'] ?? $this->mechanicFor($category),
            'structure_type' => $result['structure_type'] ?? $category,
            'rationale' => $result['rationale'] ?? 'LLM structural classification with multi-signal analysis.',
            'confidence_matrix' => $matrix,
            'confidence' => $matrix[match ($category) {
                'Timeline' => 'seq',
                'Process' => 'cyc',
                'CauseEffect' => 'cau',
                'Comparison' => 'comp',
            }] ?? 85,
            'tokens_processed' => (int) round(str_word_count($text) * 1.3),
            'via_groq' => true,
        ];
    }

    public function generate(string $text, string $category, ?string $model = null): ?array
    {
        $schema = match ($category) {
            'Timeline' => '{"levels":[{"name":"string","events":[{"id":"string","title":"string","date":"string","desc":"string","order":0,"sourcePassage":"verbatim or faithful quote from source"}]}]}',
            'Process' => '{"phases":[{"name":"string","stages":[{"id":"string","title":"string","desc":"string","question":"string","options":["a","b","c","d"],"correctIndex":0,"rationale":"string","sourcePassage":"string","simParams":{"label":"string","targetMin":40,"targetMax":60}}]}]}',
            'CauseEffect' => '{"levels":[{"name":"string","chains":[{"id":"string","cause":"string","effect":"string","rationale":"string","sourcePassage":"string"}]}]}',
            default => '{"categories":["Entity A name from text","Entity B name from text"],"cards":[{"id":"string","text":"string","category":"must match one category exactly","rationale":"string","sourcePassage":"string"}]}',
        };

        $system = <<<PROMPT
You are Lorebound's grounded game content generator. Create RICH, PLAYABLE curriculum games.

STRICT RULES:
1. Use ONLY facts from the source text — zero hallucinations
2. sourcePassage must be a direct quote or faithful paraphrase from the source
3. Return ONLY valid JSON matching this schema for "{$category}":
{$schema}

VOLUME REQUIREMENTS (for 30+ minute gameplay):
- Timeline: 3-4 levels, 5-6 events per level, ordered chronologically within each level
- Process: 3 phases, 4-5 stages per phase with 4 plausible MCQ options each; correctIndex 0-3; include simParams per stage
- CauseEffect: 3 levels, 4-5 cause-effect pairs per level in causal order
- Comparison: use real entity names from text as categories; 18-24 cards with balanced distribution

QUALITY:
- Process distractors must be plausible misconceptions from the same domain
- Timeline dates must match source; titles concise (under 60 chars)
- Cause-effect pairs must be logically linked per the source
- Comparison cards: one clear attribute per card, no ambiguity

Self-check before responding: every item traceable to source text.
PROMPT;

        $result = $this->groq->chatJson($system, "Generate comprehensive game payload from:\n\n".mb_substr($text, 0, 12000), $model);
        if (! $result || empty($result)) {
            return null;
        }

        return $this->validatePayload($result, $category) ? $result : null;
    }

    private function normalizeMatrix(array $matrix, string $category): array
    {
        $defaults = ['seq' => 15, 'cyc' => 15, 'cau' => 15, 'comp' => 15];
        $key = match ($category) {
            'Process' => 'cyc',
            'CauseEffect' => 'cau',
            'Comparison' => 'comp',
            default => 'seq',
        };

        $merged = array_merge($defaults, array_intersect_key($matrix, $defaults));
        if (($merged[$key] ?? 0) < 50) {
            $merged[$key] = 85;
        }

        return $merged;
    }

    private function validatePayload(array $payload, string $category): bool
    {
        return match ($category) {
            'Timeline' => ! empty($payload['levels']) && count($payload['levels']) >= 2,
            'Process' => ! empty($payload['phases']) && count($payload['phases']) >= 2,
            'CauseEffect' => ! empty($payload['levels']) && count($payload['levels']) >= 2,
            default => ! empty($payload['cards']) && count($payload['cards']) >= 8,
        };
    }

    private function mechanicFor(string $category): string
    {
        return match ($category) {
            'Process' => 'Process Loop',
            'CauseEffect' => 'Cause-Effect Chain',
            'Comparison' => 'Comparison Sorter',
            default => 'Timeline Builder',
        };
    }
}
