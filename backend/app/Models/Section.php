<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Section extends Model {
    use HasFactory;

    protected $fillable = [
        'name',

        // ✅ ADDED
        'department',
        'grade_level',
        'strand'
    ];

    public function rooms() {
        return $this->hasMany(Room::class);
    }
}