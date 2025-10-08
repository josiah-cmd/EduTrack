<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    // Step 1 — list all quizzes
    public function index()
    {
        $quizzes = Quiz::with('questions')->orderBy('created_at', 'desc')->get();
        return response()->json($quizzes);
    }

    // Step 1 — create quiz info
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'instructions' => 'nullable|string', // ✅ was description
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'duration' => 'required|integer|min:1', // ✅ was time_limit
            'passing_score' => 'nullable|numeric|min:0',
            'total_points' => 'nullable|numeric|min:0',
            'room_id' => 'required|exists:rooms,id',
        ]);

        $quiz = Quiz::create([
            'teacher_id' => auth()->user()->teacher->id, // ✅ include teacher
            'room_id' => $validated['room_id'],
            'title' => $validated['title'],
            'instructions' => $validated['instructions'] ?? null, // ✅ fixed
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'duration' => $validated['duration'], // ✅ fixed
            'passing_score' => $validated['passing_score'] ?? 0,
            'total_points' => $validated['total_points'] ?? 0,
            'status' => 'draft',
        ]);

        return response()->json($quiz, 201);
    }

    // Step 2 — add questions to quiz
    public function addQuestions(Request $request, $id)
    {
        $quiz = Quiz::findOrFail($id);

        $validated = $request->validate([
            'questions' => 'required|array|min:1',
            'questions.*.question_text' => 'required|string',
            'questions.*.type' => 'required|string|in:multiple_choice,true_false,identification',
            'questions.*.points' => 'required|numeric|min:1',
            'questions.*.correct_answer' => 'required|string',
            'questions.*.options' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['questions'] as $q) {
                $question = new Question([
                    'quiz_id' => $quiz->id,
                    'question_text' => $q['question_text'],
                    'type' => $q['type'],
                    'points' => $q['points'],
                    'correct_answer' => $q['correct_answer'],
                    'options' => isset($q['options']) ? json_encode($q['options']) : null,
                ]);
                $question->save();
            }

            DB::commit();
            return response()->json(['message' => 'Questions added successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to save questions', 'exception' => $e->getMessage()], 500);
        }
    }

    // Step 3 — show quiz + questions
    public function show($id)
    {
        $quiz = Quiz::with('questions')->findOrFail($id);
        foreach ($quiz->questions as $q) {
            if ($q->options) {
                $q->options = json_decode($q->options, true);
            }
        }
        return response()->json($quiz);
    }

    // Step 3 — update quiz (status or details)
    public function update(Request $request, $id)
    {
        $quiz = Quiz::findOrFail($id);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
            'time_limit' => 'nullable|string',
            'passing_score' => 'nullable|numeric|min:0',
            'total_points' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:draft,published',
        ]);

        $quiz->update($validated);

        return response()->json(['message' => 'Quiz updated successfully', 'quiz' => $quiz]);
    }

    // delete a quiz
    public function destroy($id)
    {
        $quiz = Quiz::findOrFail($id);
        $quiz->delete();

        return response()->json(['message' => 'Quiz deleted successfully']);
    }

    // toggle active/inactive quiz status
    public function toggleStatus($id)
    {
        $quiz = Quiz::findOrFail($id);
        $quiz->status = $quiz->status === 'published' ? 'draft' : 'published';
        $quiz->save();

        return response()->json(['message' => 'Quiz status toggled', 'status' => $quiz->status]);
    }

    public function getQuestions($id)
    {
        $quiz = Quiz::with(['questions.options'])->find($id);

        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found'], 404);
        }

        // Optional: format response for easier frontend handling
        $questions = $quiz->questions->map(function ($q) {
            return [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'type' => $q->type,
                'points' => $q->points,
                'correct_answer' => $q->correct_answer,
                'options' => $q->options->pluck('option_text'), // return just text of options
            ];
        });

        return response()->json([
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
            ],
            'questions' => $questions,
        ]);
    }
}