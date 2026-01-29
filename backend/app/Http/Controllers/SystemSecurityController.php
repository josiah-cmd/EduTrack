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

    /* =========================================================
     | 🔐 AUTHENTICATION SETTINGS (ADDED — DOES NOT AFFECT ABOVE)
     | Security & Access → Authentication Settings
     ========================================================= */

    /**
     * Get authentication-related system settings
     */
    public function getAuthSettings()
    {
        return response()->json([
            'password_min_length' => Setting::get('auth.password_min_length', 8),
            'max_login_attempts'  => Setting::get('auth.max_login_attempts', 5),
            'lockout_minutes'     => Setting::get('auth.lockout_minutes', 15),
            'session_timeout'     => Setting::get('auth.session_timeout', 30),
        ]);
    }

    /**
     * Update authentication-related system settings
     */
    public function updateAuthSettings(Request $request)
    {
        $data = $request->validate([
            'password_min_length' => 'required|integer|min:6|max:64',
            'max_login_attempts'  => 'required|integer|min:3|max:10',
            'lockout_minutes'     => 'required|integer|min:1|max:120',
            'session_timeout'     => 'required|integer|min:5|max:240',
        ]);

        Setting::updateOrCreate(
            ['key' => 'auth.password_min_length'],
            ['value' => $data['password_min_length']]
        );

        Setting::updateOrCreate(
            ['key' => 'auth.max_login_attempts'],
            ['value' => $data['max_login_attempts']]
        );

        Setting::updateOrCreate(
            ['key' => 'auth.lockout_minutes'],
            ['value' => $data['lockout_minutes']]
        );

        Setting::updateOrCreate(
            ['key' => 'auth.session_timeout'],
            ['value' => $data['session_timeout']]
        );

        return response()->json([
            'message' => 'Authentication settings updated successfully'
        ]);
    }

    /* =========================================================
     | 🔁 ROUTE COMPATIBILITY ALIASES (DO NOT REMOVE)
     | Matches routes/api.php exactly
     ========================================================= */

    /**
     * Alias for routes calling getAuthenticationSettings
     */
    public function getAuthenticationSettings()
    {
        return $this->getAuthSettings();
    }

    /**
     * Alias for routes calling updateAuthenticationSettings
     */
    public function updateAuthenticationSettings(Request $request)
    {
        return $this->updateAuthSettings($request);
    }
}