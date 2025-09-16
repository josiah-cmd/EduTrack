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

// Public route
Route::post('/login', [AuthController::class, 'login']);
Route::post('/users', [UserController::class, 'store']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Rooms
    Route::get('/rooms', [RoomController::class, 'index']); 
    Route::post('/rooms', [RoomController::class, 'store']);
    Route::get('/teacher/rooms', [RoomController::class, 'teacherRooms']);
    Route::get('/student/rooms', [RoomController::class, 'studentRooms']);
    Route::post('/rooms/join', [RoomController::class, 'joinRoom']);
    Route::put('/rooms/{room}', [RoomController::class, 'update']);
    Route::get('/rooms/{room}/people', [RoomController::class, 'people']);

    // Subjects / Teachers / Sections
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::get('/teachers', [TeacherController::class, 'index']);
    Route::get('/sections', [SectionController::class, 'index']);

    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/stats', [UserController::class, 'stats']);

    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy']);

    Route::post('/materials', [MaterialController::class, 'store']); 
    Route::get('/materials', [MaterialController::class, 'index']); 
    Route::get('/materials/{id}/download', [MaterialController::class, 'download']); 
    Route::get('/materials/{id}/preview', [MaterialController::class, 'preview']); 
});