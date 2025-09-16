<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // Create a new user (Admin only)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|in:student,teacher,admin,staff',
            'email' => 'required|email|unique:users,email',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'role' => $validated['role'],
            'email' => $validated['email'],
            'password' => Hash::make('password'), // default password
        ]);

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
