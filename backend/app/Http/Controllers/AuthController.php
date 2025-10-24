<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->with('teacher.subject')->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // 🔒 Added: Check if the user is locked
        if ($user->is_locked) {
            return response()->json(['message' => 'Your account is locked. Please contact the administrator.'], 403);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        // Base user response
        $response = [
            'token' => $token,
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ];

        // If the user is a teacher, attach teacher details
        if ($user->role === 'teacher' && $user->teacher) {
            $response['user']['teacher'] = [
                'id'         => $user->teacher->id,
                'department' => $user->teacher->department,
                'subject'    => $user->teacher->subject ? $user->teacher->subject->name : null,
            ];
        }

        return response()->json($response);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('teacher.subject');

        $response = [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
        ];

        if ($user->role === 'teacher' && $user->teacher) {
            $response['teacher'] = [
                'id'         => $user->teacher->id,
                'department' => $user->teacher->department,
                'subject'    => $user->teacher->subject ? $user->teacher->subject->name : null,
            ];
        }

        return response()->json($response);
    }
}