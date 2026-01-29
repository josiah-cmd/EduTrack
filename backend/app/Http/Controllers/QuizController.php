<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\Question;
use App\Models\Option;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Auth;
use App\Models\Room;

class QuizController extends Controller
{
    public function index(Request $request)
    {
        $query = Quiz::with('questions');

        // ✅ Only classroom quizzes
        $query->where('is_test_bank', false);

        // ✅ Filter by room if provided
        if ($request->has('room_id')) {
            $query->where('room_id', $request->room_id);
        }

        $quizzes = $query->orderBy('created_at', 'desc')->get();

        return response()->json($quizzes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'instructions' => 'nullable|string',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
            'duration' => 'required|integer|min:1',
            'passing_score' => 'nullable|numeric|min:0',
            'total_points' => 'nullable|numeric|min:0',
            'room_id' => 'nullable|exists:rooms,id',
            'is_test_bank' => 'sometimes|boolean',
        ]);

        $quiz = Quiz::create([
            'teacher_id' => auth()->user()->teacher->id,
            'room_id' => $validated['room_id'] ?? null,
            'title' => $validated['title'],
            'instructions' => $validated['instructions'] ?? null,
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'duration' => $validated['duration'],
            'passing_score' => $validated['passing_score'] ?? 0,
            'total_points' => $validated['total_points'] ?? 0,

            // ✅ AUTO-PUBLISH if assigned to a room and NOT test bank
            'status' => (!empty($validated['room_id']) && empty($validated['is_test_bank']))
                ? 'published'
                : 'draft',

            'is_test_bank' => $validated['is_test_bank'] ?? false,
        ]);

        return response()->json($quiz, 201);
    }

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
            'questions.*.options.*.label' => 'required_with:questions.*.options|string|max:1',
            'questions.*.options.*.text' => 'required_with:questions.*.options|string',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['questions'] as $q) {
                $question = Question::create([
                    'quiz_id' => $quiz->id,
                    'question_text' => $q['question_text'],
                    'type' => $q['type'],
                    'points' => $q['points'],
                    'correct_answer' => $q['correct_answer'],
                    'is_test_bank' => false,
                ]);

                if (isset($q['options']) && is_array($q['options']) && count($q['options']) > 0) {
                    foreach ($q['options'] as $opt) {
                        Option::create([
                            'question_id' => $question->id,
                            'label' => $opt['label'],
                            'text' => $opt['text'],
                        ]);
                    }
                }
            }

            DB::commit();
            return response()->json(['message' => 'Questions added successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to save questions', 'exception' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $quiz = Quiz::with('questions.options')->findOrFail($id);
        return response()->json($quiz);
    }

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

        $wasDraft = $quiz->status === 'draft';
        $quiz->update($validated);

        if ($wasDraft && isset($validated['status']) && $validated['status'] === 'published') {
            $quiz->load('room.students');
            $teacher = Auth::user();

            if ($quiz->room && $quiz->room->students->count() > 0) {
                $recipients = $quiz->room->students->pluck('id')->filter()->toArray();

                if (!empty($recipients)) {
                    NotificationService::notify(
                        'quiz',
                        "[QUIZ] {$quiz->title}",
                        "A new quiz has been published by {$teacher->name}.",
                        $teacher->id,
                        $recipients,
                        $quiz->room->section_id
                    );
                }
            }
        }

        return response()->json(['message' => 'Quiz updated successfully', 'quiz' => $quiz]);
    }

    public function destroy($id)
    {
        $quiz = Quiz::findOrFail($id);
        $quiz->delete();

        return response()->json(['message' => 'Quiz deleted successfully']);
    }

    public function toggleStatus($id)
    {
        $quiz = Quiz::findOrFail($id);

        if ($quiz->status === 'draft' && $quiz->questions()->count() === 0) {
                return response()->json([
                    'error' => 'Cannot publish a quiz with no questions.'
                ], 422);
            }

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

        $questions = $quiz->questions->map(function ($q) {
            return [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'type' => $q->type,
                'points' => $q->points,
                'correct_answer' => $q->correct_answer,
                'options' => $q->options->map(fn ($o) => [
                    'id' => $o->id,
                    'label' => $o->label,
                    'text' => $o->text,
                ]),
            ];
        });

        return response()->json([
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'instructions' => $quiz->instructions,
                'duration' => $quiz->duration,
            ],
            'questions' => $questions,
        ]);
    }

    /* ========================= TEST BANK LOGIC ========================= */

    public function saveToTestBank($id)
    {
        $quiz = Quiz::with('questions.options')->findOrFail($id);

        DB::beginTransaction();
        try {
            $bankQuiz = Quiz::create([
                'teacher_id' => $quiz->teacher_id,
                'room_id' => null,
                'start_time' => null,
                'end_time' => null,
                'title' => $quiz->title,
                'instructions' => $quiz->instructions,
                'duration' => $quiz->duration,
                'passing_score' => $quiz->passing_score,
                'total_points' => $quiz->total_points,
                'status' => 'draft',
                'is_test_bank' => true,
            ]);

            foreach ($quiz->questions as $q) {
                $newQuestion = Question::create([
                    'quiz_id' => $bankQuiz->id,
                    'teacher_id' => $quiz->teacher_id,
                    'question_text' => $q->question_text,
                    'type' => $q->type,
                    'correct_answer' => $q->correct_answer,
                    'points' => $q->points,
                    'is_test_bank' => true,
                ]);

                foreach ($q->options as $opt) {
                    Option::create([
                        'question_id' => $newQuestion->id,
                        'label' => $opt->label,
                        'text' => $opt->text,
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Quiz saved to test bank']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function attachTestBankQuiz(Request $request)
    {
        $validated = $request->validate([
            'quiz_id' => 'required|exists:quizzes,id',
            'room_id' => 'required|exists:rooms,id',
        ]);

        $bankQuiz = Quiz::with('questions.options')
            ->where('is_test_bank', true)
            ->findOrFail($validated['quiz_id']);

        $sourceQuiz = $bankQuiz;

        if ($bankQuiz->questions->count() === 0) {
            $fallback = Quiz::with('questions.options')
                ->where('is_test_bank', true)
                ->where('teacher_id', $bankQuiz->teacher_id)
                ->where('title', $bankQuiz->title)
                ->where('id', '<>', $bankQuiz->id)
                ->whereHas('questions')
                ->first();

            if ($fallback) {
                $sourceQuiz = $fallback;
            } else {
                $fallback = Quiz::with('questions.options')
                    ->where('is_test_bank', false)
                    ->where('teacher_id', $bankQuiz->teacher_id)
                    ->where('title', $bankQuiz->title)
                    ->whereHas('questions')
                    ->first();

                if ($fallback && $fallback->questions->isNotEmpty()) {
                    $sourceQuiz = $fallback;
                } else {
                    return response()->json([
                        'error' => 'Test bank quiz has no questions and cannot be attached.'
                    ], 422);
                }
            }
        }

        DB::beginTransaction();
        try {
            $newQuiz = Quiz::create([
                'teacher_id' => auth()->user()->teacher->id,
                'room_id' => $validated['room_id'],
                'title' => $sourceQuiz->title,
                'instructions' => $sourceQuiz->instructions,
                'duration' => $sourceQuiz->duration,
                'passing_score' => $sourceQuiz->passing_score,
                'total_points' => $sourceQuiz->total_points,
                'status' => 'published',
                'source_quiz_id' => $sourceQuiz->id,
                'is_test_bank' => false,
            ]);

            foreach ($sourceQuiz->questions as $q) {
                $newQuestion = Question::create([
                    'quiz_id' => $newQuiz->id,
                    'teacher_id' => auth()->user()->teacher->id,
                    'question_text' => $q->question_text,
                    'type' => $q->type,
                    'correct_answer' => $q->correct_answer,
                    'points' => $q->points,
                    'is_test_bank' => false,
                ]);

                foreach ($q->options as $opt) {
                    Option::create([
                        'question_id' => $newQuestion->id,
                        'label' => $opt->label,
                        'text' => $opt->text,
                    ]);
                }
            }

            $newQuiz->load('room.students');
            $teacher = Auth::user();

            if ($newQuiz->room && $newQuiz->room->students->count() > 0) {
                NotificationService::notify(
                    'quiz',
                    "[QUIZ] {$newQuiz->title}",
                    "A new quiz has been published by {$teacher->name}.",
                    $teacher->id,
                    $newQuiz->room->students->pluck('id')->toArray(),
                    $newQuiz->room->section_id
                );
            }

            DB::commit();
            return response()->json(['message' => 'Quiz attached to room and published']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
