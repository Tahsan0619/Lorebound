<?php

namespace App\Services\Compiler;

use App\Services\Groq\GroqClientService;

class AssessmentEvaluatorService
{
    public function __construct(private GroqClientService $groq) {}

    /**
     * @param  array<string, mixed>  $assessment
     * @return array<string, mixed>|null
     */
    public function evaluate(
        array $assessment,
        string $userAnswer,
        string $sourceText,
        ?string $model = null
    ): ?array {
        if (! $this->groq->isConfigured()) {
            return $this->heuristicEvaluate($assessment, $userAnswer, $sourceText);
        }

        $system = <<<'PROMPT'
You are a Lorebound learning coach. Output JSON only. NEVER give numeric scores or letter grades.

Evaluate the student's written answer against the source material and evaluation guide.

Return:
{
  "interpretation": "You approached this as: ... (mirror their reasoning respectfully)",
  "truthLevel": "fully_true|partially_true|fully_false",
  "partialPercent": 0-100,
  "whatIsTrue": "what parts align with the source (empty if none)",
  "whatIsFalse": "what parts contradict or miss the source (empty if none)",
  "fullExplanation": "clear teaching explanation grounded in the source (teach the correct concept)",
  "sourceGrounding": "short quote or paraphrase from source"
}

RULES:
- Treat gibberish, keyboard smash, or empty reasoning as fully_false.
- If the student only copies or lightly edits phrases from the question prompt (quoted fragments, question wording) without explaining in their own words, mark fully_false.
- Repeating source vocabulary from the prompt is NOT the same as understanding. Look for causal reasoning, predictions, comparisons, or evidence use.
- If even 5-10% is correct, use partially_true and explain BOTH the small truth AND why the rest fails.
- If fully false, say clearly the idea is fully false, then teach the correct concept in fullExplanation.
- If fully true, affirm specifically what they got right, then deepen with one extra insight in fullExplanation.
- fullExplanation must ALWAYS teach the correct idea from the source. Never paste evaluation labels like "Answer references the source...".
- No shaming. No "wrong!" or percentages shown as grades.
- NEVER use em-dashes or en-dashes. Use commas, periods, or colons instead.
PROMPT;

        $guide = $assessment['evaluationGuide'] ?? [];
        $user = json_encode([
            'assessment' => [
                'type' => $assessment['type'] ?? '',
                'prompt' => $assessment['prompt'] ?? '',
                'context' => $assessment['context'] ?? '',
                'sourcePassage' => $assessment['sourcePassage'] ?? '',
                'evaluationGuide' => $guide,
            ],
            'studentAnswer' => $userAnswer,
            'sourceExcerpt' => mb_substr($sourceText, 0, 2500),
        ], JSON_UNESCAPED_UNICODE);

        $response = $this->groq->chatJson($system, $user, $model, [
            'models' => $this->groq->modelsForRole('evaluate'),
            'max_tokens' => 900,
            'temperature' => 0.15,
        ]);

        if ($response === null || empty($response['data'])) {
            return $this->heuristicEvaluate($assessment, $userAnswer, $sourceText);
        }

        $data = $response['data'];
        $level = (string) ($data['truthLevel'] ?? 'partially_true');
        if (! in_array($level, ['fully_true', 'partially_true', 'fully_false'], true)) {
            $level = 'partially_true';
        }

        $fullExplanation = trim((string) ($data['fullExplanation'] ?? ''));
        if ($fullExplanation === '' || $this->looksLikeTemplateLabel($fullExplanation)) {
            $fullExplanation = $this->teachingExplanation($assessment, $sourceText);
        }

        [$level, $whatIsTrue, $whatIsFalse, $partialPercent] = $this->applyAnswerQualityGates(
            $assessment,
            $userAnswer,
            $level,
            trim((string) ($data['whatIsTrue'] ?? '')),
            trim((string) ($data['whatIsFalse'] ?? '')),
            max(0, min(100, (int) ($data['partialPercent'] ?? 0))),
        );

        return TextSanitizer::deep([
            'interpretation' => trim((string) ($data['interpretation'] ?? 'Let us review your reasoning.')),
            'truthLevel' => $level,
            'partialPercent' => $partialPercent,
            'whatIsTrue' => $whatIsTrue,
            'whatIsFalse' => $whatIsFalse,
            'fullExplanation' => $fullExplanation,
            'sourceGrounding' => trim((string) ($data['sourceGrounding'] ?? ($assessment['sourcePassage'] ?? ''))),
            'engine' => 'groq',
        ]);
    }

    /**
     * @param  array<string, mixed>  $assessment
     * @return array<string, mixed>
     */
    private function heuristicEvaluate(array $assessment, string $userAnswer, string $sourceText = ''): array
    {
        $answer = strtolower(trim($userAnswer));
        $guide = $assessment['evaluationGuide'] ?? [];
        $keyIdeas = array_values(array_filter(array_map(
            static fn ($idea) => strtolower(trim((string) $idea)),
            (array) ($guide['keyIdeas'] ?? [])
        )));

        $passage = strtolower(trim((string) ($assessment['sourcePassage'] ?? '')));
        $tokens = $this->meaningfulTokens($answer);
        $passageTokens = $this->meaningfulTokens($passage.' '.implode(' ', $keyIdeas).' '.mb_substr(strtolower($sourceText), 0, 800));

        $overlap = 0;
        foreach ($tokens as $token) {
            if (in_array($token, $passageTokens, true)) {
                $overlap++;
            }
        }

        $ideaHits = 0;
        foreach ($keyIdeas as $idea) {
            if ($idea !== '' && (str_contains($answer, $idea) || $this->softContains($answer, $idea))) {
                $ideaHits++;
            }
        }

        $isGibberish = $this->looksLikeGibberish($userAnswer);
        $promptEcho = $this->promptEchoRatio($assessment, $userAnswer);
        $tokenRatio = count($tokens) > 0 ? $overlap / count($tokens) : 0.0;
        $ideaRatio = $keyIdeas === [] ? $tokenRatio : ($ideaHits / count($keyIdeas));
        $score = max($tokenRatio, $ideaRatio);
        $hasReasoning = $this->showsReasoning($userAnswer);

        if ($isGibberish || mb_strlen(trim($userAnswer)) < 20) {
            $level = 'fully_false';
            $pct = 0;
        } elseif ($this->isPromptEchoAnswer($assessment, $userAnswer)) {
            $level = 'fully_false';
            $pct = max(0, min(15, (int) round($score * 20)));
        } elseif ($score >= 0.45 && $promptEcho < 0.5 && $hasReasoning && mb_strlen($userAnswer) >= 45) {
            $level = 'fully_true';
            $pct = (int) round(min(100, max(70, $score * 100)));
        } elseif ($score >= 0.18 || ($ideaHits >= 1 && $hasReasoning && $promptEcho < 0.65)) {
            $level = 'partially_true';
            $pct = (int) round(max(10, min(65, $score * 100)));
        } else {
            $level = 'fully_false';
            $pct = (int) round(max(0, min(25, $score * 100)));
        }

        $teaching = $this->teachingExplanation($assessment, $sourceText);

        $whatIsTrue = '';
        $whatIsFalse = '';
        if ($level === 'fully_false') {
            $whatIsFalse = $isGibberish
                ? 'The answer does not communicate a real idea from the source. Write a clear explanation in your own words.'
                : ($this->isPromptEchoAnswer($assessment, $userAnswer)
                    ? 'You repeated phrases from the question instead of explaining the idea. Restate the concept with your own reasoning and an example.'
                    : 'Important source ideas are missing or the reasoning does not fully match the material.');
        } elseif ($level === 'fully_true') {
            $whatIsTrue = 'Your answer connects to the key ideas from the source and shows coherent reasoning.';
        } else {
            $whatIsTrue = 'Some parts of your answer touch the topic, but important mechanism or evidence is still missing.';
            $whatIsFalse = 'Strengthen the answer with cause, effect, or evidence from the source, not just copied wording.';
        }

        return TextSanitizer::deep([
            'interpretation' => 'You approached this as: "'.mb_substr(trim($userAnswer), 0, 220).(mb_strlen($userAnswer) > 220 ? '...' : '').'"',
            'truthLevel' => $level,
            'partialPercent' => $pct,
            'whatIsTrue' => $whatIsTrue,
            'whatIsFalse' => $whatIsFalse,
            'fullExplanation' => $teaching,
            'sourceGrounding' => (string) ($assessment['sourcePassage'] ?? mb_substr($sourceText, 0, 160)),
            'engine' => 'heuristic',
        ]);
    }

    /** @param  array<string, mixed>  $assessment */
    private function teachingExplanation(array $assessment, string $sourceText): string
    {
        $guide = $assessment['evaluationGuide'] ?? [];
        $candidates = [
            (string) ($guide['fullyCorrect'] ?? ''),
            (string) ($assessment['sourcePassage'] ?? ''),
            mb_substr(trim($sourceText), 0, 280),
        ];

        foreach ($candidates as $candidate) {
            $candidate = trim($candidate);
            if ($candidate !== '' && ! $this->looksLikeTemplateLabel($candidate)) {
                return $candidate;
            }
        }

        $title = trim((string) ($assessment['title'] ?? 'this idea'));

        return "According to the source, {$title} should be explained using the mechanism and evidence in the study notes, not generic or unrelated statements.";
    }

    private function looksLikeTemplateLabel(string $text): bool
    {
        $lower = strtolower($text);

        return str_contains($lower, 'answer references the source')
            || str_contains($lower, 'answer contradicts the source')
            || str_contains($lower, 'answer mentions the topic but misses')
            || str_contains($lower, 'answer uses source concepts accurately');
    }

    private function looksLikeGibberish(string $text): bool
    {
        $clean = preg_replace('/\s+/', '', strtolower(trim($text))) ?? '';
        if ($clean === '') {
            return true;
        }

        $vowels = preg_match_all('/[aeiou]/', $clean) ?: 0;
        $letters = preg_match_all('/[a-z]/', $clean) ?: 0;
        if ($letters < 12) {
            return true;
        }

        $vowelRatio = $letters > 0 ? ($vowels / $letters) : 0;

        return $vowelRatio < 0.18 && ! preg_match('/\b(the|and|because|when|which|from|with|battery|power|source)\b/i', $text);
    }

    /** @return array<int, string> */
    private function meaningfulTokens(string $text): array
    {
        $parts = preg_split('/[^a-z0-9]+/', strtolower($text)) ?: [];
        $stop = ['the', 'and', 'or', 'a', 'an', 'to', 'of', 'in', 'on', 'for', 'is', 'are', 'was', 'were', 'this', 'that', 'with', 'as', 'it', 'be', 'by', 'from', 'at'];

        return array_values(array_unique(array_filter(
            $parts,
            static fn ($p) => strlen($p) >= 4 && ! in_array($p, $stop, true)
        )));
    }

    private function softContains(string $haystack, string $needle): bool
    {
        $needleTokens = $this->meaningfulTokens($needle);
        if ($needleTokens === []) {
            return false;
        }

        $hits = 0;
        foreach ($needleTokens as $token) {
            if (str_contains($haystack, $token)) {
                $hits++;
            }
        }

        return $hits >= max(1, (int) ceil(count($needleTokens) * 0.5));
    }

    /** @param  array<string, mixed>  $assessment */
    private function promptEchoRatio(array $assessment, string $userAnswer): float
    {
        $prompt = strtolower(trim((string) ($assessment['prompt'] ?? '')));
        $answerTokens = $this->meaningfulTokens(strtolower($userAnswer));
        $promptTokens = $this->meaningfulTokens($prompt);

        if ($answerTokens === [] || $promptTokens === []) {
            return 0.0;
        }

        $fromPrompt = 0;
        foreach ($answerTokens as $token) {
            if (in_array($token, $promptTokens, true)) {
                $fromPrompt++;
            }
        }

        return $fromPrompt / count($answerTokens);
    }

    /** @param  array<string, mixed>  $assessment */
    private function isPromptEchoAnswer(array $assessment, string $userAnswer): bool
    {
        $answer = trim($userAnswer);
        if ($answer === '') {
            return true;
        }

        $prompt = trim((string) ($assessment['prompt'] ?? ''));
        $promptEcho = $this->promptEchoRatio($assessment, $answer);
        $hasReasoning = $this->showsReasoning($answer);

        if ($promptEcho >= 0.72) {
            return true;
        }

        if ($promptEcho >= 0.55 && ! $hasReasoning && mb_strlen($answer) < 220) {
            return true;
        }

        $answerLower = strtolower($answer);
        $promptLower = strtolower($prompt);
        similar_text($answerLower, $promptLower, $percent);

        return $percent >= 48.0 && ! $hasReasoning;
    }

    private function showsReasoning(string $text): bool
    {
        $lower = strtolower($text);
        $signals = [
            'because', 'therefore', 'so that', 'this means', 'would', 'will', 'leads to',
            'results in', 'reason', 'since', 'thus', 'hence', 'as a result', 'for example',
            'such as', 'compared to', 'differs', 'similar', 'unlike', 'predict', 'expect',
            'true because', 'false because', 'partially', 'next step', 'consequence',
        ];

        foreach ($signals as $signal) {
            if (str_contains($lower, $signal)) {
                return true;
            }
        }

        return preg_match('/\b(i think|in my view|my answer|this shows|that is why)\b/i', $text) === 1;
    }

    /**
     * @return array{0: string, 1: string, 2: string, 3: int}
     */
    private function applyAnswerQualityGates(
        array $assessment,
        string $userAnswer,
        string $level,
        string $whatIsTrue,
        string $whatIsFalse,
        int $partialPercent
    ): array {
        if ($this->isPromptEchoAnswer($assessment, $userAnswer)) {
            return [
                'fully_false',
                '',
                'You repeated phrases from the question instead of explaining the idea. Restate the concept with your own reasoning and an example.',
                max(0, min(15, $partialPercent)),
            ];
        }

        if ($level === 'fully_true' && (! $this->showsReasoning($userAnswer) || $this->promptEchoRatio($assessment, $userAnswer) >= 0.45)) {
            return [
                'partially_true',
                'You named relevant source ideas, but the answer still needs clearer reasoning in your own words.',
                'Add cause, effect, comparison, or prediction language to show understanding, not just copied wording.',
                max(15, min(55, $partialPercent > 0 ? $partialPercent : 35)),
            ];
        }

        return [$level, $whatIsTrue, $whatIsFalse, $partialPercent];
    }
}
