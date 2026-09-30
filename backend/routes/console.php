<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Services\NotificationService;
use Symfony\Component\Process\Process;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('notifications:generate', function (NotificationService $service) {
    $this->info($service->generate().' notificaciones nuevas.');
})->purpose('Genera alertas operativas idempotentes del día');

Artisan::command('app:backup-database {--output=}', function () {
    if (config('database.default') !== 'mysql') { $this->error('El respaldo explícito solo admite MySQL.'); return self::FAILURE; }
    $connection=config('database.connections.mysql'); $directory=storage_path('app/backups');
    if(!is_dir($directory)) mkdir($directory,0750,true);
    $output=$this->option('output') ?: $directory.'/jesegurity-'.now()->format('Ymd-His').'.sql';
    $process=new Process(['mysqldump','--host='.$connection['host'],'--port='.(string)$connection['port'],'--user='.$connection['username'],'--single-transaction','--routines','--result-file='.$output,$connection['database']],null,['MYSQL_PWD'=>$connection['password']]);
    $process->setTimeout(600); $process->run();
    if(!$process->isSuccessful()){ $this->error(trim($process->getErrorOutput())); return self::FAILURE; }
    $this->info('Respaldo creado: '.$output); return self::SUCCESS;
})->purpose('Crea bajo demanda un respaldo MySQL con mysqldump');
