<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Subject;
use App\Models\User;
use App\Models\Room;

class Teacher extends Model {
    use HasFactory;

    protected $fillable = [
        'name',        // so you can mass assign it in seeder
        'user_id',
        'subject_id',
        'department'
    ];

    // Teacher belongs to a User
    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Teacher belongs to a Subject
    public function subject() {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    // Teacher can have many Rooms
    public function rooms() {
        return $this->hasMany(Room::class);
    }
}