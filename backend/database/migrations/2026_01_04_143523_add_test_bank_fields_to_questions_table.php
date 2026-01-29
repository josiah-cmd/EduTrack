<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->unsignedBigInteger('teacher_id')->nullable()->after('id');
            $table->boolean('is_test_bank')->default(false)->after('points');
            $table->unsignedTinyInteger('grade_level')->nullable()->after('is_test_bank');
            $table->string('difficulty')->nullable()->after('grade_level');
        });
    }

    public function down()
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn(['teacher_id', 'is_test_bank', 'grade_level', 'difficulty']);
        });
    }
};