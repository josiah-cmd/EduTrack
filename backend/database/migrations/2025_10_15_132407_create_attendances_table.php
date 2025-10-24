<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            // student (user) who the attendance belongs to
            $table->unsignedBigInteger('student_id')->index();
            // subject (nullable if attendance is general)
            $table->unsignedBigInteger('subject_id')->nullable()->index();
            // date of attendance (no time)
            $table->date('date')->index();
            // present / absent / late
            $table->enum('status', ['present', 'absent', 'late'])->default('present');
            $table->string('notes')->nullable();
            $table->timestamps();

            // foreign keys (optional; ensure users & subjects tables exist)
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('set null');
            $table->unique(['student_id','subject_id','date'], 'attendance_unique_per_day_subject');
        });
    }

    public function down()
    {
        Schema::dropIfExists('attendances');
    }
};