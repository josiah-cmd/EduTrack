<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use Illuminate\Http\Request;

class TestBankController extends Controller
{
    /**
     * List all test bank quizzes of this teacher
     */
    public function index()
    {
        return Quiz::where('is_test_bank', true)
            ->where('teacher_id', auth()->user()->teacher->id)
            ->with('questions.options')
            ->get();
    }

    /**
     * Create a new Test Bank Quiz (empty shell)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $quiz = Quiz::create([
            'title' => $validated['title'],
            'instructions' => null,
            'teacher_id' => auth()->user()->teacher->id,
            'room_id' => null,
            'is_test_bank' => true,
            'status' => 'draft',   // ← matches your model
            'total_points' => 0,
            'passing_score' => 0,
            'duration' => 0,
        ]);

        return response()->json($quiz, 201);
    }
}