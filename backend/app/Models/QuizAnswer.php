<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_attempt_id',
        'question_id',
        'selected_option_id',
        'is_correct',
    ];

    public function attempt() {
        return $this->belongsTo(QuizAttempt::class);
    }

    public function question() {
        return $this->belongsTo(Question::class);
    }

    public function option() {
        return $this->belongsTo(Option::class, 'selected_option_id');
    }
}