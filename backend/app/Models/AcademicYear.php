<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class AcademicYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'year_label',
        'start_date',
        'end_date',
        'is_active',
    ];

    /* ---------------- RELATIONSHIPS ---------------- */

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    /* ---------------- HELPERS ---------------- */

    public function hasEnded(): bool
    {
        return Carbon::now()->greaterThan($this->end_date);
    }

    public function isCurrent(): bool
    {
        return $this->is_active && ! $this->hasEnded();
    }
}