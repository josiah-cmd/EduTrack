<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model {
    use HasFactory;

    protected $fillable = ['subject_id','teacher_id','section_id','day','time','created_by', 'token'];

    protected $casts = [
        'day' => 'array',
    ];

    public function subject() {
        return $this->belongsTo(Subject::class);
    }

    public function teacher() {
        return $this->belongsTo(Teacher::class);
    }

    public function section() {
        return $this->belongsTo(Section::class);
    }

    public function creator() {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function students() {
        return $this->belongsToMany(User::class, 'room_user', 'room_id', 'user_id')->where('role', 'student');
    }

    public function materials() {
        return $this->hasMany(Material::class);
    }
}