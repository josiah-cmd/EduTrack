<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('grading_systems', function (Blueprint $table) {
            $table->id();
            $table->integer('passing_grade')->default(75);
            $table->string('grade_letters')->nullable(); // "A,B,C,D,F"
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grading_systems');
    }
};