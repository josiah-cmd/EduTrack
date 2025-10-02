<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;
use App\Services\NotificationService; // ✅ added
use App\Models\User;

class AnnouncementController extends Controller
{
    // List all announcements
    public function index(Request $request)
    {
        $user = $request->user();

        $announcements = Announcement::with('user:id,name,role')
            ->when($user->role === 'teacher', function($q){
                $q->whereIn('target_role', ['all', 'student']);
            })
            ->when($user->role === 'student', function($q){
                $q->whereIn('target_role', ['all', 'student']);
            })
            ->latest()
            ->get();

        return response()->json($announcements);
    }

    // Create announcement (admin/staff only)
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $targetRole = 'all'; // default for admin/staff

        if ($user->role === 'teacher') {
            $targetRole = 'student'; // teacher announcements go to students only
        } elseif (!in_array($user->role, ['admin', 'staff'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $announcement = Announcement::create([
            'created_by' => $user->id,
            'content' => $validated['content'],
            'target_role' => $targetRole,
        ]);

        // ✅ Send notification
        $recipients = User::where(function ($q) use ($targetRole) {
            if ($targetRole === 'all') {
                $q->whereIn('role', ['admin','staff','teacher','student']);
            } elseif ($targetRole === 'student') {
                $q->where('role', 'student');
            }
        })->pluck('id')->toArray(); // ✅ ensure array

        NotificationService::notify(
            'announcement',
            'New Announcement',
            $validated['content'],
            $user->id,
            $recipients
        );

        return response()->json([
            'message' => 'Announcement created successfully',
            'announcement' => $announcement->load('user:id,name,role'),
        ], 201);
    }

    // Update announcement
    public function update(Request $request, Announcement $announcement)
    {
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'staff'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $announcement->update(['content' => $validated['content']]);

        return response()->json([
            'message' => 'Announcement created successfully',
            'announcement' => $announcement->load('user:id,name,role'),
        ], 201);
    }

    // Delete announcement
    public function destroy(Request $request, Announcement $announcement)
    {
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'staff'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted']);
    }
}