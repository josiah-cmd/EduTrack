<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\AuditLog;
use Carbon\Carbon;

class SystemMaintenanceController extends Controller
{
    /* ---------------------- 🧠 AUDIT LOGS ---------------------- */
    public function getAuditLogs()
    {
        $logs = AuditLog::with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'time' => $log->created_at->format('Y-m-d h:i A'),
                    'user' => $log->user->name ?? 'System',
                    'ip_address' => $log->ip_address,
                ];
            });

        return response()->json($logs);
    }

    public static function recordLog($action)
    {
        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'ip_address' => request()->ip(),
        ]);
    }

    /* ---------------------- 🗃️ BACKUP & RESTORE ---------------------- */
    public function createBackup()
    {
        try {
            $timestamp = Carbon::now()->format('Ymd_His');
            $filename = "backup_{$timestamp}.sql";
            $path = storage_path("app/backups");

            if (!file_exists($path)) {
                mkdir($path, 0777, true);
            }

            // ✅ Database-only backup command
            $command = sprintf(
                'mysqldump -u%s -p%s %s > %s',
                escapeshellarg(env('DB_USERNAME')),
                escapeshellarg(env('DB_PASSWORD')),
                escapeshellarg(env('DB_DATABASE')),
                escapeshellarg($path . '/' . $filename)
            );

            system($command);

            self::recordLog("Created system backup: {$filename}");
            return response()->json(['success' => true, 'message' => 'Backup created successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Backup failed: ' . $e->getMessage()], 500);
        }
    }

    public function restoreBackup(Request $request)
    {
        try {
            // 🔹 In real usage, specify a backup file and confirm restore
            self::recordLog("System restore initiated by user");
            return response()->json(['success' => true, 'message' => 'Restore simulation successful. (Real restore disabled for safety)']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Restore failed: ' . $e->getMessage()], 500);
        }
    }

    /* ---------------------- 🧹 CLEAR CACHE ---------------------- */
    public function clearCache()
    {
        try {
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('view:clear');
            Artisan::call('route:clear');

            self::recordLog("Cleared system cache and temporary data");
            return response()->json(['success' => true, 'message' => 'Cache cleared successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Cache clear failed: ' . $e->getMessage()], 500);
        }
    }

    /* ---------------------- 📤 IMPORT / EXPORT ---------------------- */
    public function importData(Request $request)
    {
        try {
            if (!$request->hasFile('file')) {
                return response()->json(['success' => false, 'message' => 'No file uploaded.']);
            }

            $file = $request->file('file');
            $filePath = $file->storeAs('imports', $file->getClientOriginalName(), 'local');

            self::recordLog("Imported data file: " . $file->getClientOriginalName());
            return response()->json(['success' => true, 'message' => 'File uploaded successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Import failed: ' . $e->getMessage()], 500);
        }
    }

    public function exportData()
    {
        try {
            $timestamp = Carbon::now()->format('Ymd_His');
            $file = "export_{$timestamp}.csv";

            $path = storage_path("app/exports/{$file}");
            if (!file_exists(dirname($path))) {
                mkdir(dirname($path), 0777, true);
            }

            // ✅ Export basic user data for demonstration
            $users = DB::table('users')->get();
            $csvData = "ID,Name,Email\n";
            foreach ($users as $u) {
                $csvData .= "{$u->id},{$u->name},{$u->email}\n";
            }
            file_put_contents($path, $csvData);

            self::recordLog("Exported system data: {$file}");
            return response()->json(['success' => true, 'message' => 'Data exported successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }
}