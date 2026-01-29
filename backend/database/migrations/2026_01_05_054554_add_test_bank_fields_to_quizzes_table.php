<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->boolean('is_test_bank')->default(false)->after('status');
            $table->unsignedBigInteger('source_quiz_id')->nullable()->after('is_test_bank');
        });
    }

    public function down()
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn(['is_test_bank', 'source_quiz_id']);
        });
    }
};