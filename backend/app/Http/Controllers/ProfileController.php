<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    // Get profile of logged-in user
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // Update profile of logged-in user
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'gender' => 'nullable|string|in:Male,Female,Other',
            'dob' => 'nullable|date',
            'profile_picture' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('profile_picture')) {
            // delete old if exists
            if ($user->profile_picture) {
                Storage::delete($user->profile_picture);
            }
            $path = $request->file('profile_picture')->store('profile_pictures', 'public');
            $validated['profile_picture'] = $path;
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ]);
    }

    // Admin can update someone else's profile
    public function adminUpdate(Request $request, User $user)
    {
        $this->authorize('update', $user); // optional policy

        $validated = $request->validate([
            'name' => 'string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'gender' => 'nullable|string|in:Male,Female,Other',
            'dob' => 'nullable|date',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'User profile updated successfully by admin',
            'user' => $user,
        ]);
    }
}