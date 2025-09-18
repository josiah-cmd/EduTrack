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
    // Teacher uploads assignments, notes, etc.
    Route::post('/materials', [MaterialController::class, 'store']); 
    Route::get('/materials', [MaterialController::class, 'index']); 
    Route::get('/materials/{id}/download', [MaterialController::class, 'download']); 
    Route::get('/materials/{id}/preview', [MaterialController::class, 'preview']); 

    /* ------------------- SUBMISSIONS ------------------- */
    // Students submit their work, linked to material_id
    Route::get('/submissions/{materialId}', [AssignmentSubmissionController::class, 'index']); // teacher view
    Route::post('/submissions', [AssignmentSubmissionController::class, 'store']); // upload
    Route::get('/submissions/my/{materialId}', [AssignmentSubmissionController::class, 'mySubmissions']); // student view

    Route::get('/me', [AuthController::class, 'me']);
});