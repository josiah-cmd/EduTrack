<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssignmentSubmission extends Model {
    use HasFactory;

    protected $fillable = [
        'material_id',
        'student_id',
        'file_path',
        'filename',
        'submitted_at',
    ];

    protected $appends = ['filename', 'file_url'];

    public function material() {
        return $this->belongsTo(Material::class, 'material_id');
    }

    public function student() {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function getFilenameAttribute() {
        return basename($this->file_path);
    }

    public function getFileUrlAttribute() {
        return $this->file_path
            ? asset('storage/' . $this->file_path)
            : null;
    }
}