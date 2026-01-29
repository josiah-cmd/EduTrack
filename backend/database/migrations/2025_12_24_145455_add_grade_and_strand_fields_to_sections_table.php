<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('sections', function (Blueprint $table) {
            $table->string('department')->nullable()->after('name');
            $table->string('grade_level')->nullable()->after('department');
            $table->string('strand')->nullable()->after('grade_level');
        });
    }

    public function down(): void {
        Schema::table('sections', function (Blueprint $table) {
            $table->dropColumn(['department', 'grade_level', 'strand']);
        });
    }
};