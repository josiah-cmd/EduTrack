<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAnswer;
use App\Models\Option;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentQuizController extends Controller
{
    /**
     * 🟢 Get all available quizzes (published only)
     * Optionally filters to rooms the authenticated student belongs to.
     */
    public function index(Request $request)
    {
        // Start query with only published quizzes
        $query = Quiz::where('status', 'published');

        // If user is authenticated, filter by rooms they belong to
        $user = $request->user();
        if ($user) {
            try {
                $roomIds = $user->rooms()->pluck('rooms.id')->toArray();
                if (!empty($roomIds)) {
                    $query->whereIn('room_id', $roomIds);
                }
            } catch (\Throwable $e) {
                // Ignore relationship issues, still return published quizzes
            }
        }

        // ✅ The missing part: actually execute the query
        $quizzes = $query->with('teacher.user:id,name')->get();

        return response()->json($quizzes, 200);
    }

    /**
     * 🟢 View quiz details (with questions and options)
     */
    public function show($id)
    {
        $quiz = Quiz::with(['questions.options'])->findOrFail($id);
        return response()->json($quiz);
    }

    /**
     * 🟢 Start a new quiz attempt
     */
    public function start($quiz_id)
    {
        $student_id = Auth::id();

        if (!$student_id) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Prevent multiple attempts for the same quiz
        $existing = QuizAttempt::where('quiz_id', $quiz_id)
            ->where('student_id', $student_id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You already started this quiz.',
                'attempt' => $existing
            ]);
        }

        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz_id,
            'student_id' => $student_id,
            'status' => 'in_progress'
        ]);

        return response()->json($attempt);
    }

    /**
     * 🟢 Submit quiz answers
     */
    public function submit(Request $request, $attempt_id)
    {
        $attempt = QuizAttempt::with('quiz.questions')->findOrFail($attempt_id);

        $totalScore = 0;
        $totalPoints = $attempt->quiz->questions->sum('points');

        foreach ($request->answers as $answerData) {
            $question = Question::find($answerData['question_id']);
            $selectedOption = Option::find($answerData['selected_option_id']);

            $isCorrect = false;
            if ($question && $selectedOption) {
                $isCorrect = ($selectedOption->label === $question->correct_answer);
            }

            if ($isCorrect) {
                $totalScore += $question->points;
            }

            QuizAnswer::create([
                'quiz_attempt_id' => $attempt->id,
                'question_id' => $question->id,
                'selected_option_id' => $selectedOption->id ?? null,
                'is_correct' => $isCorrect,
            ]);
        }

        $attempt->update([
            'score' => $totalScore,
            'total_points' => $totalPoints,
            'status' => 'completed'
        ]);

        return response()->json([
            'message' => 'Quiz submitted successfully.',
            'score' => $totalScore,
            'total_points' => $totalPoints,
            'percentage' => $totalPoints > 0 ? round(($totalScore / $totalPoints) * 100, 2) : 0
        ]);
    }

    /**
     * 🟢 View quiz result
     */
    public function result($attempt_id)
    {
        $attempt = QuizAttempt::with([
            'quiz',
            'answers.question',
            'answers.option'
        ])->findOrFail($attempt_id);

        return response()->json($attempt);
    }

    /**
     * 🟢 Get student's attempts for all quizzes
     */
    public function attempts(Request $request)
    {
        $student_id = Auth::id();

        $attempts = \App\Models\QuizAttempt::where('student_id', $student_id)
            ->select('id', 'quiz_id', 'status', 'score', 'total_points')
            ->get();

        return response()->json($attempts);
    }
}