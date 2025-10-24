<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class QuizAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'student_id',
        'score',
        'total_points',
        'status'
    ];

    public function quiz() {
        return $this->belongsTo(Quiz::class);
    }

    public function student() {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function answers() {
        return $this->hasMany(QuizAnswer::class);
    }
}