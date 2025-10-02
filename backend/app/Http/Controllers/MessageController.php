<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User; // ✅ needed for recipient lookup
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\NotificationService; // ✅ added

class MessageController extends Controller
{
    /**
     * Default messages list (Inbox or Sent based on query)
     */
    public function index(Request $request)
    {
        $type = $request->query('type', 'inbox'); // default inbox
        if ($type === 'sent') {
            return $this->sent($request);
        }
        return $this->inbox($request);
    }

    /**
     * Get all received messages (Inbox)
     */
    public function inbox(Request $request = null)
    {
        $user = Auth::user();
        $sort = $request ? $request->query('sort', 'desc') : 'desc'; // newest first by default

        // ✅ Pagination
        $page = $request ? (int) $request->query('page', 1) : 1;
        $limit = $request ? (int) $request->query('limit', 10) : 10;

        $messages = Message::where('recipient_email', $user->email)
            ->with('sender')
            ->orderBy('created_at', $sort)
            ->paginate($limit, ['*'], 'page', $page);

        $messages->getCollection()->transform(function ($msg) {
            $recipient = User::where('email', $msg->recipient_email)->first();
            $msg->recipient = $recipient ? [
                'name' => $recipient->name,
                'email' => $recipient->email,
            ] : ['name' => null, 'email' => $msg->recipient_email];
            return $msg;
        });

        return response()->json($messages);
    }

    /**
     * Get all sent messages
     */
    public function sent(Request $request = null)
    {
        $sort = $request ? $request->query('sort', 'desc') : 'desc'; // newest first by default

        // ✅ Pagination
        $page = $request ? (int) $request->query('page', 1) : 1;
        $limit = $request ? (int) $request->query('limit', 10) : 10;

        $messages = Message::where('sender_id', Auth::id())
            ->orderBy('created_at', $sort)
            ->paginate($limit, ['*'], 'page', $page);

        $messages->getCollection()->transform(function ($msg) {
            $recipient = User::where('email', $msg->recipient_email)->first();
            $msg->recipient = $recipient ? [
                'name' => $recipient->name,
                'email' => $recipient->email,
            ] : ['name' => null, 'email' => $msg->recipient_email];
            return $msg;
        });

        return response()->json($messages);
    }

    /**
     * Send a new message
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'recipient_email' => 'required|email',
            'subject' => 'required|string',
            'body' => 'required|string',
        ]);

        // ✅ Make sure recipient exists
        $recipient = User::where('email', $validated['recipient_email'])->first();
        if (!$recipient) {
            return response()->json([
                'success' => false,
                'message' => 'Recipient not found in users table',
            ], 422);
        }

        // ✅ Allow all roles (admin, staff, teacher, student) to send
        $message = Message::create([
            'sender_id' => auth()->id(),
            'recipient_email' => $recipient->email, // ensure valid user
            'subject' => $validated['subject'],
            'body' => $validated['body'],
            'is_read' => false,
        ]);

        // ✅ Send notification to recipient
        $sender = auth()->user();
        $role = $sender->role ?? 'User';

        NotificationService::notify(
            'message',
            '[MESSAGE] ' . $validated['subject'],   // ✅ clean title
            "A new message from {$role} ({$sender->name})", // ✅ clean body (NO HTML)
            $sender->id,
            [$recipient->id]
        );

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully',
            'data' => $message,
        ], 201);
    }

    /**
     * Mark a message as read
     */
    public function markAsRead($id)
    {
        $message = Message::where('id', $id)
            ->where('recipient_email', Auth::user()->email)
            ->firstOrFail();

        $message->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Message marked as read',
            'data' => $message,
        ]);
    }

    /**
     * Delete a message (sender or recipient can delete)
     */
    public function destroy($id)
    {
        $message = Message::where(function ($query) {
                $query->where('sender_id', Auth::id())
                      ->orWhere('recipient_email', Auth::user()->email); // ✅ adjusted to email
            })
            ->where('id', $id)
            ->firstOrFail();

        $message->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully'
        ]);
    }

    /**
     * Show a single message by ID
     */
    public function show($id)
    {
        $message = Message::with('sender')
            ->where('id', $id)
            ->where(function ($query) {
                $query->where('sender_id', Auth::id())
                      ->orWhere('recipient_email', Auth::user()->email);
            })
            ->firstOrFail();

        $recipient = User::where('email', $message->recipient_email)->first();
        $message->recipient = $recipient ? [
            'name' => $recipient->name,
            'email' => $recipient->email,
        ] : ['name' => null, 'email' => $message->recipient_email];

        return response()->json($message);
    }
}