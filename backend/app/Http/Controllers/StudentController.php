<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Room;
use App\Models\Material;
use App\Models\AssignmentSubmission;
use App\Models\Quiz;
use App\Models\QuizAttempt;

class StudentController extends Controller
{
    /**
     * Get dashboard statistics for the authenticated student
     */
    public function dashboardStats(Request $request)
    {
        $studentId = auth()->id();

        /* ================= ADDED ================= */
        $activeYear = activeAcademicYear();
        if (! $activeYear) {
            return response()->json([
                'enrolled_subjects'   => 0,
                'pending_assignments' => 0,
                'pending_quizzes'     => 0,
            ]);
        }

        /* ================= NEW (NON-BREAKING) ================= */
        // Allow frontend to override academic year (student browsing)
        $requestedYearId = $request->query('academic_year_id');

        if ($requestedYearId) {
            $requestedYear = \App\Models\AcademicYear::find($requestedYearId);
            if ($requestedYear) {
                $activeYear = $requestedYear;
            }
        }
        /* ====================================================== */

        /* ========================================= */

        /**
         * 1. Enrolled Subjects
         * Count rooms the student joined
         */
        $enrolledSubjects = Room::where('academic_year_id', $activeYear->id) // ADDED
            ->where('is_archived', false)                                    // ADDED
            ->whereHas('students', function ($query) use ($studentId) {
                $query->where('users.id', $studentId);
            })->count();

        /**
         * 2. Pending Assignments
         * Assignments in joined rooms
         * that the student has NOT submitted
         */
        $pendingAssignments = Material::where('type', 'assignment')
            ->whereHas('room', function ($roomQuery) use ($studentId, $activeYear) { // ADDED
                $roomQuery
                    ->where('academic_year_id', $activeYear->id)                    // ADDED
                    ->where('is_archived', false)                                    // ADDED
                    ->whereHas('students', function ($query) use ($studentId) {
                        $query->where('users.id', $studentId);
                    });
            })
            ->whereDoesntHave('room.materials', function ($query) use ($studentId) {
                $query->whereIn('id', function ($subQuery) use ($studentId) {
                    $subQuery->select('material_id')
                        ->from('assignment_submissions')
                        ->where('student_id', $studentId);
                });
            })
            ->count();

        /**
         * 3. Pending Quizzes
         * Published quizzes in joined rooms
         * with NO attempt by the student
         */
        $pendingQuizzes = Quiz::where('status', 'published')
            ->whereHas('room', function ($roomQuery) use ($studentId, $activeYear) { // ADDED
                $roomQuery
                    ->where('academic_year_id', $activeYear->id)                    // ADDED
                    ->where('is_archived', false)                                    // ADDED
                    ->whereHas('students', function ($query) use ($studentId) {
                        $query->where('users.id', $studentId);
                    });
            })
            ->whereDoesntHave('results', function ($query) use ($studentId) {
                $query->where('student_id', $studentId);
            })
            ->count();

        return response()->json([
            'enrolled_subjects'   => $enrolledSubjects,
            'pending_assignments' => $pendingAssignments,
            'pending_quizzes'     => $pendingQuizzes,
        ]);
    }
}