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
            'department' => 'nullable|string|max:255',
            'subject_id' => 'nullable|integer|exists:subjects,id',
            'grade_level' => 'nullable|string|max:50',
            'section_id' => 'nullable|integer|exists:sections,id',

            // 🔹 LRN rules (ADDED)
            'lrn' => [
                'nullable',
                'digits:12',
                'unique:users,lrn',
            ],
        ]);

        // 🔹 Enforce LRN only for students
        if ($validated['role'] === 'student' && empty($validated['lrn'])) {
            return response()->json([
                'message' => 'LRN is required for student accounts.',
            ], 422);
        }

        if ($validated['role'] !== 'student') {
            $validated['lrn'] = null;
        }

        $user = User::create([
            'name' => $validated['name'],
            'role' => $validated['role'],
            'email' => $validated['email'],
            'password' => Hash::make('password'),
            'grade_level' => $validated['grade_level'] ?? null,
            'section_id' => $validated['section_id'] ?? null,
            'lrn' => $validated['lrn'] ?? null, // ✅ ADDED
        ]);

        // 🔹 If the new user is a teacher, create a teacher record
        if ($validated['role'] === 'teacher') {
            \App\Models\Teacher::create([
                'user_id' => $user->id,
                'name' => $user->name,
                'department' => $validated['department'] ?? null,
                'subject_id' => $validated['subject_id'] ?? null,
            ]);
        }

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user,
        ], 201);
    }

    // Update an existing user (Admin / Staff)
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|in:student,teacher,admin,staff',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'department' => 'nullable|string|max:255',
            'subject_id' => 'nullable|integer|exists:subjects,id',
            'grade_level' => 'nullable|string|max:50',
            'section_id' => 'nullable|integer|exists:sections,id',

            // 🔹 LRN update rules
            'lrn' => [
                'nullable',
                'digits:12',
                'unique:users,lrn,' . $user->id,
            ],
        ]);

        if ($validated['role'] === 'student' && empty($validated['lrn'])) {
            return response()->json([
                'message' => 'LRN is required for student accounts.',
            ], 422);
        }

        if ($validated['role'] !== 'student') {
            $validated['lrn'] = null;
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'grade_level' => $validated['grade_level'] ?? null,
            'section_id' => $validated['section_id'] ?? null,
            'lrn' => $validated['lrn'] ?? null, // ✅ ADDED
        ]);

        if ($validated['role'] === 'teacher') {

            Teacher::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => $validated['name'],
                    'department' => $validated['department'] ?? null,
                    'subject_id' => $validated['subject_id'] ?? null,
                ]
            );

        } else {
            Teacher::where('user_id', $user->id)->delete();
        }

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user,
        ]);
    }

    public function stats()
    {
        $totalUsers = User::count();
        $totalTeachers = User::where('role', 'teacher')->count();
        $totalStudents = User::where('role', 'student')->count();

        return response()->json([
            'totalUsers' => $totalUsers,
            'totalTeachers' => $totalTeachers,
            'totalStudents' => $totalStudents,
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if ($user->role === 'teacher') {
            Teacher::where('user_id', $user->id)->delete();
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ], 200);
    }

    public function index()
    {
        return response()->json(User::all());
    }
}