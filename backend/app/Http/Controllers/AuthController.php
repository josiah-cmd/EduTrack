<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Models\Setting;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->with('teacher.subject')->first();

        // 🔒 Manual admin lock (EXISTING FEATURE)
        if ($user && $user->is_locked) {
            return response()->json([
                'message' => 'Your account is locked. Please contact the administrator.'
            ], 403);
        }

        // ⏱️ Temporary lock (Authentication Settings)
        if ($user && $user->lock_until && now()->lessThan($user->lock_until)) {

            // ✅ FIX: Use seconds → round up to whole minutes
            $secondsRemaining = now()->diffInSeconds($user->lock_until);
            $minutesRemaining = max(1, ceil($secondsRemaining / 60));

            return response()->json([
                'message' => "Too many login attempts. Try again in {$minutesRemaining} minute(s)."
            ], 423);
        }

        // ❌ Invalid credentials
        if (!$user || !Hash::check($request->password, $user->password)) {

            if ($user) {
                $maxAttempts = (int) Setting::get('auth.max_login_attempts', 5);
                $lockMinutes = (int) Setting::get('auth.lockout_minutes', 15);

                $user->failed_attempts++;

                if ($user->failed_attempts >= $maxAttempts) {
                    $user->lock_until = now()->addMinutes($lockMinutes);
                    $user->failed_attempts = 0;
                }

                $user->save();
            }

            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // ✅ Successful login → reset security counters
        if ($user->failed_attempts || $user->lock_until) {
            $user->failed_attempts = 0;
            $user->lock_until = null;
            $user->save();
        }

        $token = $user->createToken('api-token')->plainTextToken;

        $response = [
            'token' => $token,
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ];

        if ($user->role === 'teacher' && $user->teacher) {
            $response['user']['teacher'] = [
                'id'         => $user->teacher->id,
                'department' => $user->teacher->department,
                'subject'    => $user->teacher->subject
                    ? $user->teacher->subject->name
                    : null,
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
                'subject'    => $user->teacher->subject
                    ? $user->teacher->subject->name
                    : null,
            ];
        }

        return response()->json($response);
    }
}