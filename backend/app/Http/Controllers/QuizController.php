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
    public function index()
    {
        $quizzes = Quiz::with('questions')->orderBy('created_at', 'desc')->get();
        return response()->json($quizzes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'instructions' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'duration' => 'required|integer|min:1',
            'passing_score' => 'nullable|numeric|min:0',
            'total_points' => 'nullable|numeric|min:0',
            'room_id' => 'required|exists:rooms,id',
        ]);

        $quiz = Quiz::create([
            'teacher_id' => auth()->user()->teacher->id,
            'room_id' => $validated['room_id'],
            'title' => $validated['title'],
            'instructions' => $validated['instructions'] ?? null,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'duration' => $validated['duration'],
            'passing_score' => $validated['passing_score'] ?? 0,
            'total_points' => $validated['total_points'] ?? 0,
            'status' => 'draft',
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
                    $title = "[QUIZ] " . $quiz->title;
                    $body = "A new quiz has been published by {$teacher->name}.";

                    NotificationService::notify(
                        'quiz',
                        $title,
                        $body,
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
                'options' => $q->options->map(function ($o) {
                    return [
                        'label' => $o->label,
                        'text' => $o->text,
                        'id' => $o->id,
                    ];
                }),
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

    public function publish($id)
    {
        $quiz = Quiz::with('room.students')->findOrFail($id);
        $quiz->status = 'published';
        $quiz->save();

        $teacher = Auth::user();

        if ($quiz->room && $quiz->room->students->count() > 0) {
            $recipients = $quiz->room->students->pluck('id')->filter()->toArray();

            if (!empty($recipients)) {
                $title = "[QUIZ] " . $quiz->title;
                $body = "A new quiz has been published by {$teacher->name}.";

                NotificationService::notify(
                    'quiz',
                    $title,
                    $body,
                    $teacher->id,
                    $recipients,
                    $quiz->room->section_id
                );
            }
        }

        return response()->json([
            'message' => 'Quiz published successfully and notifications sent!',
            'quiz' => $quiz
        ]);
    }

    public function attemptsByQuiz($id)
    {
        $attempts = QuizAttempt::with('student:id,name,email')
            ->where('quiz_id', $id)
            ->get()
            ->map(function ($attempt) {
                return [
                    'id' => $attempt->id,
                    'student_name' => $attempt->student->name ?? 'Unknown',
                    'student_email' => $attempt->student->email ?? 'N/A',
                    'score' => $attempt->score,
                    'total_points' => $attempt->total_points,
                    'status' => $attempt->status,
                    'submitted_at' => $attempt->updated_at,
                ];
            });

        return response()->json($attempts);
    }
}