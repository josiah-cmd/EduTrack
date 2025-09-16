<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'type',
        'title',
        'description',
        'file_path',
        'deadline'
    ];

    public function teacher() {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}