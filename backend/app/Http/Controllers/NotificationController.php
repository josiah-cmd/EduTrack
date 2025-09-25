<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get logged-in user's notifications
     */
    public function index()
    {
        $notifications = Notification::where('recipient_id', Auth::id())
            ->latest()
            ->paginate(10); // supports infinite scroll

        return response()->json($notifications);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($id)
    {
        $notification = Notification::where('recipient_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Notification marked as read']);
    }
}