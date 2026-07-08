<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Compiler\AssessmentEvaluatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvaluateController extends Controller
{
    public function __construct(private AssessmentEvaluatorService $evaluator) {}

    public function evaluateAnswer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'assessment' => 'required|array',
            'user_answer' => 'required|string|min:10|max:2000',
            'source_text' => 'required|string|max:12000',
            'model' => 'nullable|string|max:100',
        ]);

        $result = $this->evaluator->evaluate(
            $validated['assessment'],
            $validated['user_answer'],
            $validated['source_text'],
            $validated['model'] ?? null,
        );

        if ($result === null) {
            return response()->json(['message' => 'Could not evaluate answer.'], 422);
        }

        return response()->json(['feedback' => $result]);
    }
}
