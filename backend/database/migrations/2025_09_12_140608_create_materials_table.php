<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('teacher_id');
            $table->enum('type', ['module', 'assignment']); 
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path'); 
            $table->timestamp('deadline')->nullable(); 
            $table->timestamps();

            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
            $table->unsignedBigInteger('room_id'); // ✅ added
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade'); // ✅ added
        });
    }

    public function down(): void {
        Schema::dropIfExists('materials');
    }
};