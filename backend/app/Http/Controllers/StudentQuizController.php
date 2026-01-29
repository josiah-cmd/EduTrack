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
    public function index(Request $request)
    {
        $query = Quiz::where('status', 'published');

        $user = $request->user();
        if ($user) {
            try {
                $roomIds = $user->rooms()->pluck('rooms.id')->toArray();
                if (!empty($roomIds)) {
                    $query->whereIn('room_id', $roomIds);
                }
            } catch (\Throwable $e) {}
        }

        $quizzes = $query->with('teacher.user:id,name')->get();
        return response()->json($quizzes, 200);
    }

    public function show($id)
    {
        $student_id = Auth::id();
        if (!$student_id) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $attempt = QuizAttempt::where('quiz_id', $id)
            ->where('student_id', $student_id)
            ->first();

        $quiz = Quiz::with(['questions.options'])->findOrFail($id);

        if ($quiz->questions->isEmpty() && $quiz->source_quiz_id) {
            $bankQuiz = Quiz::with('questions.options')->find($quiz->source_quiz_id);
            $sourceQuiz = $bankQuiz;

            if ($bankQuiz && $bankQuiz->questions->isEmpty()) {
                $fallback = Quiz::with('questions.options')
                    ->where('is_test_bank', true)
                    ->where('teacher_id', $quiz->teacher_id)
                    ->where('title', $quiz->title)
                    ->where('id', '<>', $bankQuiz->id)
                    ->whereHas('questions')
                    ->first();

                if ($fallback) {
                    $sourceQuiz = $fallback;
                } else {
                    $fallback = Quiz::with('questions.options')
                        ->where('is_test_bank', false)
                        ->where('teacher_id', $quiz->teacher_id)
                        ->where('title', $quiz->title)
                        ->whereHas('questions')
                        ->first();

                    if ($fallback && $fallback->questions->isNotEmpty()) {
                        $sourceQuiz = $fallback;
                    }
                }
            }

            if ($sourceQuiz && $sourceQuiz->questions->isNotEmpty()) {
                foreach ($sourceQuiz->questions as $q) {
                    $newQuestion = Question::create([
                        'quiz_id' => $quiz->id,
                        'teacher_id' => $q->teacher_id,
                        'question_text' => $q->question_text,
                        'type' => $q->type,
                        'correct_answer' => $q->correct_answer,
                        'points' => $q->points,
                        'is_test_bank' => false,
                        'grade_level' => $q->grade_level,
                        'difficulty' => $q->difficulty,
                    ]);

                    foreach ($q->options as $opt) {
                        Option::create([
                            'question_id' => $newQuestion->id,
                            'label' => $opt->label,
                            'text' => $opt->text,
                        ]);
                    }
                }

                $quiz->load(['questions.options']);
            }
        }

        if (!$attempt) {
            $questionOrder = $quiz->questions->pluck('id')->shuffle()->values()->toArray();

            $optionOrder = [];
            foreach ($quiz->questions as $q) {
                $optionOrder[$q->id] = $q->options->pluck('id')->shuffle()->values()->toArray();
            }

            $attempt = QuizAttempt::create([
                'quiz_id' => $id,
                'student_id' => $student_id,
                'status' => 'in_progress',
                'question_order' => $questionOrder,
                'option_order' => $optionOrder,
            ]);
        } else {
            if (
                empty($attempt->question_order) ||
                !is_array($attempt->question_order) ||
                count($attempt->question_order) === 0
            ) {
                $questionOrder = $quiz->questions->pluck('id')->shuffle()->values()->toArray();

                $optionOrder = [];
                foreach ($quiz->questions as $q) {
                    $optionOrder[$q->id] = $q->options->pluck('id')->shuffle()->values()->toArray();
                }

                $attempt->update([
                    'question_order' => $questionOrder,
                    'option_order' => $optionOrder,
                ]);
                $attempt->refresh();
            }
        }

        $questions = collect($quiz->questions)
            ->sortBy(function ($q) use ($attempt) {
                $index = array_search($q->id, $attempt->question_order ?? []);
                return $index === false ? PHP_INT_MAX : $index;
            })
            ->values()
            ->map(function ($q) use ($attempt) {
                $options = collect($q->options)
                    ->sortBy(function ($opt) use ($attempt, $q) {
                        $index = array_search(
                            $opt->id,
                            $attempt->option_order[$q->id] ?? []
                        );
                        return $index === false ? PHP_INT_MAX : $index;
                    })
                    ->values();

                $q->setRelation('options', $options);
                return $q;
            });

        $quiz->attempt_id = $attempt->id;

        $quiz->setRelation('questions', $questions);

        return response()->json($quiz);
    }

    public function start($quiz_id)
    {
        $student_id = Auth::id();

        if (!$student_id) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $existing = QuizAttempt::where('quiz_id', $quiz_id)
            ->where('student_id', $student_id)
            ->first();

        /* =========================================================
           ✅ SAFE FIX: regenerate question/option order if empty
           (NO existing code removed)
        ========================================================= */
        if ($existing) {

            if (
                empty($existing->question_order) ||
                !is_array($existing->question_order) ||
                count($existing->question_order) === 0
            ) {
                $quiz = Quiz::with('questions.options')->findOrFail($quiz_id);

                $questionOrder = $quiz->questions
                    ->pluck('id')
                    ->shuffle()
                    ->values()
                    ->toArray();

                $optionOrder = [];
                foreach ($quiz->questions as $q) {
                    $optionOrder[$q->id] = $q->options
                        ->pluck('id')
                        ->shuffle()
                        ->values()
                        ->toArray();
                }

                $existing->update([
                    'question_order' => $questionOrder,
                    'option_order' => $optionOrder,
                ]);
            }

            return response()->json([
                'message' => 'You already started this quiz.',
                'attempt' => $existing
            ]);
        }

        $quiz = Quiz::with('questions.options')->findOrFail($quiz_id);

        if ($quiz->questions->isEmpty() && $quiz->source_quiz_id) {
            $bankQuiz = Quiz::with('questions.options')->find($quiz->source_quiz_id);
            $sourceQuiz = $bankQuiz;

            if ($bankQuiz && $bankQuiz->questions->isEmpty()) {
                $fallback = Quiz::with('questions.options')
                    ->where('is_test_bank', true)
                    ->where('teacher_id', $quiz->teacher_id)
                    ->where('title', $quiz->title)
                    ->where('id', '<>', $bankQuiz->id)
                    ->whereHas('questions')
                    ->first();

                if ($fallback) {
                    $sourceQuiz = $fallback;
                } else {
                    $fallback = Quiz::with('questions.options')
                        ->where('is_test_bank', false)
                        ->where('teacher_id', $quiz->teacher_id)
                        ->where('title', $quiz->title)
                        ->whereHas('questions')
                        ->first();

                    if ($fallback && $fallback->questions->isNotEmpty()) {
                        $sourceQuiz = $fallback;
                    }
                }
            }

            if ($sourceQuiz && $sourceQuiz->questions->isNotEmpty()) {
                foreach ($sourceQuiz->questions as $q) {
                    $newQuestion = Question::create([
                        'quiz_id' => $quiz->id,
                        'teacher_id' => $q->teacher_id,
                        'question_text' => $q->question_text,
                        'type' => $q->type,
                        'correct_answer' => $q->correct_answer,
                        'points' => $q->points,
                        'is_test_bank' => false,
                        'grade_level' => $q->grade_level,
                        'difficulty' => $q->difficulty,
                    ]);

                    foreach ($q->options as $opt) {
                        Option::create([
                            'question_id' => $newQuestion->id,
                            'label' => $opt->label,
                            'text' => $opt->text,
                        ]);
                    }
                }

                $quiz->load('questions.options');
            }
        }

        $questionOrder = $quiz->questions->pluck('id')->shuffle()->values()->toArray();

        $optionOrder = [];
        foreach ($quiz->questions as $q) {
            $optionOrder[$q->id] = $q->options->pluck('id')->shuffle()->values()->toArray();
        }

        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz_id,
            'student_id' => $student_id,
            'status' => 'in_progress',
            'question_order' => $questionOrder,
            'option_order' => $optionOrder,
        ]);

        return response()->json($attempt);
    }

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
            'percentage' => $totalPoints > 0
                ? round(($totalScore / $totalPoints) * 100, 2)
                : 0
        ]);
    }

    public function result($attempt_id)
    {
        $attempt = QuizAttempt::with([
            'quiz',
            'answers.question',
            'answers.option'
        ])->findOrFail($attempt_id);

        return response()->json($attempt);
    }

    public function attempts(Request $request)
    {
        $student_id = Auth::id();

        $attempts = QuizAttempt::where('student_id', $student_id)
            ->select('id', 'quiz_id', 'status', 'score', 'total_points')
            ->get();

        return response()->json($attempts);
    }
}
