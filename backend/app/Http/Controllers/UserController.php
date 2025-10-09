<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Teacher;

class UserController extends Controller
{
    // Create a new user (Admin only)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|in:student,teacher,admin,staff',
            'email' => 'required|email|unique:users,email',
            'department' => 'nullable|string|max:255', // ✅ added
            'subject_id' => 'nullable|integer|exists:subjects,id', // ✅ added
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'role' => $validated['role'],
            'email' => $validated['email'],
            'password' => Hash::make('password'), // default password
        ]);
        
        // 🔹 If the new user is a teacher, create a teacher record
        if ($validated['role'] === 'teacher') {
            \App\Models\Teacher::create([
                'user_id' => $user->id,
                'name' => $user->name, // optional field
                'department' => $validated['department'] ?? null, // ✅ accepts from form
                'subject_id' => $validated['subject_id'] ?? null, // ✅ accepts from form
            ]);
        }

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user,
        ], 201);
    }

    public function stats()
    {
        $totalUsers = \App\Models\User::count();
        $totalTeachers = \App\Models\User::where('role', 'teacher')->count();
        $totalStudents = \App\Models\User::where('role', 'student')->count();

        return response()->json([
            'totalUsers' => $totalUsers,
            'totalTeachers' => $totalTeachers,
            'totalStudents' => $totalStudents,
        ]);
    }

    // List all users
    public function index()
    {
        return response()->json(User::all());
    }
}   