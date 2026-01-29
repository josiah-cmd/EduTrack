<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Room;
use App\Models\AcademicYear;
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
            'day' => 'required',
            'time' => 'required',
        ]);

        $academicYear = selectedAcademicYear($request);

        if (! $academicYear) {
            return response()->json(['error' => 'No academic year selected'], 422);
        }

        $academicYearId = $academicYear->id;

        $token = Str::random(10);

        $schedule = [];
        if (is_array($validated['day']) && is_array($validated['time'])) {
            foreach ($validated['day'] as $i => $d) {
                $schedule[] = [
                    'day' => $d,
                    'time' => $validated['time'][$i] ?? $validated['time'][0] ?? ''
                ];
            }
        } else {
            $schedule[] = [
                'day' => is_array($validated['day']) ? $validated['day'][0] : $validated['day'],
                'time' => is_array($validated['time']) ? $validated['time'][0] : $validated['time']
            ];
        }

        $room = Room::create([
            'subject_id' => $validated['subject_id'],
            'teacher_id' => $validated['teacher_id'],
            'section_id' => $validated['section_id'],
            'day' => $this->sortDays($validated['day']),
            'time' => is_array($validated['time']) ? json_encode($validated['time']) : $validated['time'],
            'schedule' => json_encode($schedule),
            'created_by' => $user->id,
            'token' => $token,
            'academic_year_id' => $academicYear->id,
            'is_archived' => false,
        ]);

        return response()->json([
            'message' => 'Room created successfully',
            'room' => $room->load(['subject','teacher.user','section'])
        ], 201);
    }

    public function joinRoom(Request $request)
    {
        try {
            $request->validate([
                'token' => 'required|string'
            ]);

            $user = Auth::user();

            if ($user->role !== 'student') {
                return response()->json([
                    'message' => 'Only students can join rooms'
                ], 403);
            }

            $academicYear = selectedAcademicYear($request);

            if (! $academicYear) {
                return response()->json([
                    'message' => 'No academic year selected'
                ], 422);
            }

            $room = Room::where('token', $request->token)
                ->where('academic_year_id', $academicYear->id)
                ->where('is_archived', false)
                ->first();

            if (! $room) {
                return response()->json([
                    'message' => 'Invalid or expired room token'
                ], 404);
            }

            // prevent duplicate join
            if ($room->students()->where('users.id', $user->id)->exists()) {
                return response()->json([
                    'message' => 'You already joined this room'
                ], 409);
            }

            $room->students()->attach($user->id);

            return response()->json([
                'message' => 'Successfully joined room',
                'room' => $room->load(['subject','teacher.user','section'])
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Join room failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // 🔹 List Rooms for Teachers
    public function teacherRooms(Request $request)
    {
        $user = Auth::user();
        $teacher = $user->teacher;

        if (! $teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        $academicYear = selectedAcademicYear($request);

        if (! $academicYear) {
            return response()->json(['error' => 'No academic year selected'], 422);
        }

        $academicYearId = $academicYear->id;

        if (! $academicYearId) {
            return response()->json(['error' => 'academic_year_id is required'], 422);
        }

        $rooms = Room::with(['subject','teacher.user','section','students'])
            ->where('teacher_id', $teacher->id)
            ->where('academic_year_id', $academicYearId)
            // ->where('is_archived', false)
            ->get();

        return response()->json($rooms);
    }

    // 🔹 List All Rooms (Admin & Staff)
    public function index(Request $request)
    {
        $academicYear = selectedAcademicYear($request);

if (! $academicYear) {
    return response()->json(['error' => 'No academic year selected'], 422);
}

        $academicYearId = $academicYear->id;

        if (! $academicYearId) {
            return response()->json(['error' => 'academic_year_id is required'], 422);
        }

        $rooms = Room::with(['subject','teacher.user','section','creator','students'])
            ->where('academic_year_id', $academicYearId)
            // ->where('is_archived', false)
            ->get();

        return response()->json($rooms);
    }

    // 🔹 List Rooms Joined by Student
    public function studentRooms(Request $request)
    {
        $user = Auth::user();

        $academicYear = selectedAcademicYear($request);

if (! $academicYear) {
    return response()->json(['error' => 'No academic year selected'], 422);
}

        $academicYearId = $academicYear->id;

        if (! $academicYearId) {
            return response()->json(['error' => 'academic_year_id is required'], 422);
        }

        $rooms = $user->rooms()
            ->with(['subject','teacher.user','section'])
            ->where('academic_year_id', $academicYearId)
            // ->where('is_archived', false)
            ->get();

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
            'day' => 'required',
            'time' => 'required',
        ]);

        $schedule = [];
        if (is_array($validated['day']) && is_array($validated['time'])) {
            foreach ($validated['day'] as $i => $d) {
                $schedule[] = [
                    'day' => $d,
                    'time' => $validated['time'][$i] ?? $validated['time'][0] ?? ''
                ];
            }
        } else {
            $schedule[] = [
                'day' => is_array($validated['day']) ? $validated['day'][0] : $validated['day'],
                'time' => is_array($validated['time']) ? $validated['time'][0] : $validated['time']
            ];
        }

        $validated['day'] = $this->sortDays($validated['day']);
        $validated['time'] = is_array($validated['time']) ? json_encode($validated['time']) : $validated['time'];
        $validated['schedule'] = json_encode($schedule);

        $room->update($validated);

        return response()->json([
            'message' => 'Room updated successfully',
            'room' => $room->load(['subject','teacher.user','section'])
        ]);
    }

    public function destroy(Room $room)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin','staff'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $room->delete();

        return response()->json(['message' => 'Room deleted successfully']);
    }

    public function people(Room $room)
    {
        $room->load(['teacher.user', 'students']);

        return response()->json([
            'teacher' => $room->teacher ? $room->teacher->user : null,
            'students' => $room->students
        ]);
    }

    public function students($roomId)
    {
        $room = Room::with(['students' => function ($query) {
            $query->select('users.id', 'users.name', 'users.lrn', 'users.email');
        }])->findOrFail($roomId);

        return response()->json($room->students);
    }

    private function sortDays($days)
    {
        if (is_string($days)) {
            $days = json_decode($days, true) ?? [$days];
        }

        $order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        usort($days, fn($a, $b) => array_search($a, $order) <=> array_search($b, $order));

        return json_encode($days);
    }

    public function show(Room $room)
    {
        return response()->json(
            $room->load(['subject','teacher.user','section','academicYear'])
        );
    }
}