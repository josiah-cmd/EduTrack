<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academic_years', function (Blueprint $table) {
            $table->string('year_label')->unique()->after('id');
            $table->date('start_date')->after('year_label');
            $table->date('end_date')->after('start_date');
            $table->boolean('is_active')->default(false)->after('end_date');
        });
    }

    public function down(): void
    {
        Schema::table('academic_years', function (Blueprint $table) {
            $table->dropColumn([
                'year_label',
                'start_date',
                'end_date',
                'is_active',
            ]);
        });
    }
};