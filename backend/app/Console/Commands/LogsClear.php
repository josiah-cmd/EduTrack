<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class LogsClear extends Command
{
    protected $signature = 'logs:clear';
    protected $description = 'Clear log files';

    public function handle()
    {
        file_put_contents(storage_path('logs/laravel.log'), '');
        $this->info('Logs have been cleared!');
    }
}
