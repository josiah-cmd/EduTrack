<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolInformation extends Model
{
    use HasFactory;

    protected $table = 'school_information';

    protected $fillable = [
        'school_name',
        'address',
        'contact_number',
        'logo',
    ];
}