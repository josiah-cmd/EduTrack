<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->boolean('is_test_bank')->default(false)->after('file_path');
            $table->unsignedTinyInteger('grade_level')->nullable()->after('is_test_bank');
            $table->string('material_type')->nullable()->after('grade_level');
        });
    }

    public function down()
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->dropColumn(['is_test_bank', 'grade_level', 'material_type']);
        });
    }
};