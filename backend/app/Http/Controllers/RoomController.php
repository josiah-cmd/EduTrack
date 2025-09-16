<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Room;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class RoomController extends Controller
{
    // 🔹 Create Room (Admin / Staff only)
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin','staff'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:teachers,id',
            'section_id' => 'required|exists:sections,id',
            'day' => 'required|string',
            'time' => 'required|string',
        ]);

        $token = Str::random(10); // 🔹 generate token

        $room = Room::create([
            'subject_id' => $validated['subject_id'],
            'teacher_id' => $validated['teacher_id'],
            'section_id' => $validated['section_id'],
            'day' => $validated['day'],
            'time' => $validated['time'],
            'created_by' => $user->id,
            'token' => $token,
        ]);

        return response()->json([
            'message' => 'Room created successfully',
            'room' => $room->load(['subject','teacher.user','section'])
        ], 201);
    }

    // 🔹 List Rooms for Teachers
    public function teacherRooms()
    {
        $user = Auth::user();

        $teacher = $user->teacher;
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        $rooms = Room::with(['subject','teacher.user','section','students'])
            ->where('teacher_id', $teacher->id)
            ->get();

        return response()->json($rooms);
    }

    // 🔹 List All Rooms (Admin & Staff)
    public function index()
    {
        $rooms = Room::with(['subject','teacher.user','section','creator','students'])->get();
        return response()->json($rooms);
    }

    // 🔹 Student Join Room via Token
    public function joinRoom(Request $request)
    {
        $request->validate([
            'token' => 'required|string|size:10',
        ]);

        $room = Room::where('token', $request->token)->first();

        if (!$room) {
            return response()->json(['error' => 'Invalid room token'], 404);
        }

        $user = Auth::user();

        // Attach student to room
        $room->students()->syncWithoutDetaching([$user->id]);

        return response()->json([
            'message' => 'Joined room successfully',
            'room' => $room->load(['subject','teacher.user','section'])
        ]);
    }

    // 🔹 List Rooms Joined by Student
    public function studentRooms()
    {
        $user = Auth::user();

        $rooms = $user->rooms()->with(['subject','teacher.user','section'])->get();

        return response()->json($rooms);
    }
    public function update(Request $request, Room $room)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin','staff'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:teachers,id',
            'section_id' => 'required|exists:sections,id',
            'day' => 'required|string',
            'time' => 'required|string',
        ]);

        $room->update($validated);

        return response()->json([
            'message' => 'Room updated successfully',
            'room' => $room->load(['subject','teacher.user','section'])
        ]);
    }

    // 🔹 Delete Room (Admin / Staff only)
    public function destroy(Room $room)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin','staff'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $room->delete();

        return response()->json([
            'message' => 'Room deleted successfully'
        ]);
    }
    
    public function people(Room $room)
    {
        $room->load(['teacher.user', 'students']); 

        return response()->json([
            'teacher' => $room->teacher ? $room->teacher->user : null,
            'students' => $room->students
        ]);
    }
}