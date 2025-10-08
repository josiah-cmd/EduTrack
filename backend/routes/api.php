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

    /* ------------------- QUIZZES ------------------- */
    Route::get('/quizzes', [QuizController::class, 'index']);
    Route::post('/quizzes', [QuizController::class, 'store']); // Step 1
    Route::post('/quizzes/{id}/questions', [QuizController::class, 'addQuestions']); // Step 2
    Route::get('/quizzes/{id}', [QuizController::class, 'show']);
    Route::put('/quizzes/{id}', [QuizController::class, 'update']);
    Route::delete('/quizzes/{id}', [QuizController::class, 'destroy']);
    Route::patch('/quizzes/{id}/toggle', [QuizController::class, 'toggleStatus']);
    Route::get('/quizzes/{id}/questions', [QuizController::class, 'getQuestions']);
});