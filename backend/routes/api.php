<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController; 
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\AssignmentSubmissionController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\StudentQuizController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\SystemSecurityController;
use App\Http\Controllers\GeneralSettingsController;
use App\Http\Controllers\SystemMaintenanceController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/users', [UserController::class, 'store']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    /* ------------------- ROOMS ------------------- */
    Route::get('/rooms', [RoomController::class, 'index']); 
    Route::post('/rooms', [RoomController::class, 'store']);
    Route::get('/teacher/rooms', [RoomController::class, 'teacherRooms']);
    Route::get('/student/rooms', [RoomController::class, 'studentRooms']);
    Route::post('/rooms/join', [RoomController::class, 'joinRoom']);
    Route::put('/rooms/{room}', [RoomController::class, 'update']);
    Route::get('/rooms/{room}/people', [RoomController::class, 'people']);
    Route::get('/rooms/{room}/students', [RoomController::class, 'students']);

    /* ------------------- SUBJECTS / TEACHERS / SECTIONS ------------------- */
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::get('/teachers', [TeacherController::class, 'index']);
    Route::get('/sections', [SectionController::class, 'index']);

    /* ------------------- USERS ------------------- */
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/stats', [UserController::class, 'stats']);

    /* ------------------- ANNOUNCEMENTS ------------------- */
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy']);

    /* ------------------- MATERIALS ------------------- */
    Route::post('/materials', [MaterialController::class, 'store']); 
    Route::get('/materials', [MaterialController::class, 'index']); 
    Route::get('/materials/{id}/download', [MaterialController::class, 'download']); 
    Route::get('/materials/{id}/preview', [MaterialController::class, 'preview']); 

    /* ------------------- SUBMISSIONS ------------------- */
    Route::get('/submissions/{materialId}', [AssignmentSubmissionController::class, 'index']); // teacher view
    Route::post('/submissions', [AssignmentSubmissionController::class, 'store']); // upload
    Route::get('/submissions/my/{materialId}', [AssignmentSubmissionController::class, 'mySubmissions']); // student view

    /* ------------------- MESSAGES ------------------- */
    Route::get('/messages/inbox', [MessageController::class, 'inbox']);
    Route::get('/messages/sent', [MessageController::class, 'sent']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::patch('/messages/{id}/read', [MessageController::class, 'markAsRead']);
    Route::delete('/messages/{id}', [MessageController::class, 'destroy']);
    Route::get('/messages', [MessageController::class, 'index']);

    /* ------------------- NOTIFICATIONS ------------------- */
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    /* ------------------- PROFILE MANAGEMENT ------------------- */
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/profile', [ProfileController::class, 'me']);
    Route::post('/profile/update', [ProfileController::class, 'update']);
    Route::post('/profile/change-password', [ProfileController::class, 'changePassword']);

    /* ------------------- QUIZZES ------------------- */
    Route::get('/quizzes', [QuizController::class, 'index']);
    Route::post('/quizzes', [QuizController::class, 'store']); // Step 1
    Route::post('/quizzes/{id}/questions', [QuizController::class, 'addQuestions']); // Step 2
    Route::get('/quizzes/{id}', [QuizController::class, 'show']);
    Route::put('/quizzes/{id}', [QuizController::class, 'update']);
    Route::delete('/quizzes/{id}', [QuizController::class, 'destroy']);
    Route::patch('/quizzes/{id}/toggle', [QuizController::class, 'toggleStatus']);
    Route::get('/quizzes/{id}/questions', [QuizController::class, 'getQuestions']);
    Route::patch('/quizzes/{id}/publish', [QuizController::class, 'publish']);

    // ✅ STUDENT QUIZ ROUTES
    Route::get('/student/quizzes', [StudentQuizController::class, 'index']);

    // ✅ Move this ABOVE {id} to prevent "attempts" being treated as ID
    Route::get('/student/quizzes/attempts', [StudentQuizController::class, 'attempts']);

    Route::get('/student/quizzes/{id}', [StudentQuizController::class, 'show']);
    Route::post('/student/quizzes/{quiz_id}/start', [StudentQuizController::class, 'start']);
    Route::post('/student/quiz-attempts/{attempt_id}/submit', [StudentQuizController::class, 'submit']);
    Route::get('/student/quiz-attempts/{attempt_id}/result', [StudentQuizController::class, 'result']);
    Route::get('/quizzes/{id}/attempts', [QuizController::class, 'attemptsByQuiz']);

    Route::get('/grades', [GradeController::class, 'index']);
    Route::post('/grades', [GradeController::class, 'store']);
    Route::get('/grades/student/{id}', [GradeController::class, 'showStudentGrades']);
    Route::get('/grades/autoCompute/{student_id}/{quarter}', [GradeController::class, 'autoCompute']);
    Route::get('/grades/{student}/{quarter}', [GradeController::class, 'getGrade']);
    Route::get('/student/grades', [GradeController::class, 'getStudentGrades']);
    Route::patch('/grades/{id}/verify', [GradeController::class, 'verify']);
    Route::patch('/grades/{id}/unverify', [GradeController::class, 'unverify']);

    Route::get('/reports/performance', [ReportsController::class, 'studentPerformance']);
    Route::get('/reports/attendance', [ReportsController::class, 'attendanceReport']);
    Route::post('/reports/attendance', [ReportsController::class, 'storeAttendance']);
    Route::get('/reports/completion-rates', [ReportsController::class, 'subjectCompletionRates']);

    // ✅ Attendance routes
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance', [AttendanceController::class, 'store']);

    /* ------------------- SYSTEM SECURITY ------------------- */
    Route::get('/security/settings', [SystemSecurityController::class, 'getSettings']);
    Route::post('/security/settings', [SystemSecurityController::class, 'updateSettings']);
    Route::get('/security/users', [SystemSecurityController::class, 'getUsers']);
    Route::post('/security/users/{id}/lock', [SystemSecurityController::class, 'lockUser']);
    Route::post('/security/users/{id}/unlock', [SystemSecurityController::class, 'unlockUser']);

    /* ------------------- GENERAL SETTINGS ------------------- */
    Route::get('/settings/school-info', [GeneralSettingsController::class, 'getSchoolInfo']);
    Route::post('/settings/school-info', [GeneralSettingsController::class, 'updateSchoolInfo']);
    Route::get('/settings/academic-year', [GeneralSettingsController::class, 'getAcademicYear']);
    Route::post('/settings/academic-year', [GeneralSettingsController::class, 'updateAcademicYear']);
    Route::get('/settings/grading-system', [GeneralSettingsController::class, 'getGradingSystem']);
    Route::post('/settings/grading-system', [GeneralSettingsController::class, 'updateGradingSystem']);

    /* ------------------- SYSTEM MAINTENANCE ------------------- */
    Route::get('/system-maintenance/audit-logs', [SystemMaintenanceController::class, 'getAuditLogs']);
    Route::post('/system-maintenance/clear-cache', [SystemMaintenanceController::class, 'clearCache']);
    Route::post('/backup', [SystemMaintenanceController::class, 'createBackup']);
    Route::post('/restore', [SystemMaintenanceController::class, 'restoreBackup']);
    Route::post('/system-maintenance/import-data', [SystemMaintenanceController::class, 'importData']);
    Route::get('/system-maintenance/export-data', [SystemMaintenanceController::class, 'exportData']);
});