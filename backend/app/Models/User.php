<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'address',
        'profile_picture',
        'gender',
        'dob',
        'grade_level', 
        'section_id', 
        'is_locked',
        'locked_at', 
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // 🔹 User has one Teacher profile
    public function teacher()
    {
        return $this->hasOne(\App\Models\Teacher::class);
    }

    // 🔹 Rooms created by this user (admin/staff)
    public function createdRooms()
    {
        return $this->hasMany(\App\Models\Room::class, 'created_by');
    }

    // 🔹 Rooms assigned to this user as teacher
    public function teachingRooms()
    {
        return $this->hasMany(\App\Models\Room::class, 'teacher_id');
    }

    public function rooms() 
    {

        return $this->belongsToMany(Room::class, 'room_user', 'user_id', 'room_id');

    }

    public function announcements()
    {
        return $this->hasMany(\App\Models\Announcement::class);
    }

    // 🔹 Subjects (through teacher profile)
    public function subjects()
    {
        return $this->belongsToMany(
            \App\Models\Subject::class,
            'subject_teacher',
            'teacher_id',
            'subject_id'
        );
    }

    public function routeNotificationForDatabase($notification)
    {
        return $this->notifications();
    }

    public function section() 
    {
        return $this->belongsTo(Section::class);
    }
}