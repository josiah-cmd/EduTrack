<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Setting;
use Illuminate\Http\Request;

class SystemSecurityController extends Controller
{
    /**
     * Get all users (for system security management)
     */
    public function getUsers()
    {
        $users = User::select('id', 'name', 'email', 'role', 'is_locked')->get();
        return response()->json($users);
    }

    /**
     * Get all system settings
     */
    public function index()
    {
        $settings = Setting::all();
        return response()->json($settings);
    }

    /**
     * ✅ Added: Get system settings (alias for index)
     * Some routes or frontend components might call this method instead.
     */
    public function getSettings()
    {
        return $this->index();
    }

    /**
     * Update or create a setting
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'key' => 'required|string',
            'value' => 'nullable|string',
        ]);

        $setting = Setting::updateOrCreate(
            ['key' => $data['key']],
            ['value' => $data['value']]
        );

        return response()->json(['message' => 'Setting updated', 'data' => $setting]);
    }

    /**
     * Lock a specific user account
     */
    public function lockUser($id)
    {
        $user = User::findOrFail($id);
        $user->update([
            'is_locked' => true,
            'locked_at' => now(),
        ]);

        return response()->json(['message' => 'User account locked successfully']);
    }

    /**
     * Unlock a specific user account
     */
    public function unlockUser($id)
    {
        $user = User::findOrFail($id);
        $user->update([
            'is_locked' => false,
            'locked_at' => null,
        ]);

        return response()->json(['message' => 'User account unlocked successfully']);
    }

    /**
     * Get locked users
     */
    public function lockedUsers()
    {
        $lockedUsers = User::where('is_locked', true)->get();
        return response()->json($lockedUsers);
    }
}