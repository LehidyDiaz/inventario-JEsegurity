<?php

namespace Database\Seeders;

use App\Models\{Attachment, Category, Client, InventoryMovement, Location, Product, ProductBatch, PurchaseOrder, Role, Service, Supplier, User};
use App\Services\FolioService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'Administrador' => 'Acceso total al sistema',
            'Supervisor' => 'Supervisa inventario, servicios y personal',
            'Operador' => 'Registra movimientos y consulta información',
            'Técnico' => 'Ejecuta servicios en terreno',
            'Inspector' => 'Realiza inspecciones y auditorías',
        ];
        foreach ($roles as $name => $description) Role::firstOrCreate(['name' => $name], ['description' => $description]);

        $admin = User::firstOrCreate(['email' => 'admin@jesegurity.com'], [
            'role_id' => Role::where('name', 'Administrador')->value('id'),
            'full_name' => 'Administrador JESegurity',
            'password_hash' => Hash::make('123456'),
            'status' => 'Disponible',
        ]);

        foreach (['Extintores', 'EPP', 'Señalización', 'Botiquines'] as $name) Category::firstOrCreate(['name' => $name]);
        foreach (['Almacén principal', 'EPP / Estantería A', 'EPP / Estantería B', 'Señalización'] as $name) Location::firstOrCreate(['name' => $name]);

        $products = [
            ['Extintor ABC 6 kg','EXT-ABC-006','Extintores','unidades',24,10,'Almacén principal',35000],
            ['Extintor CO2 5 kg','EXT-CO2-005','Extintores','unidades',8,12,'Almacén principal',58000],
            ['Guantes anticorte nivel 5','EPP-GUA-005','EPP','pares',76,30,'EPP / Estantería A',8500],
            ['Casco de seguridad blanco','EPP-CAS-001','EPP','unidades',5,12,'EPP / Estantería B',12000],
            ['Señal salida de emergencia','SEN-SAL-002','Señalización','unidades',42,20,'Señalización',6500],
        ];
        foreach ($products as [$name,$sku,$category,$unit,$quantity,$minimum,$location,$price]) {
            Product::firstOrCreate(['sku'=>$sku], ['name'=>$name,'category_id'=>Category::where('name',$category)->value('id'),'unit'=>$unit,'quantity'=>$quantity,'minimum_quantity'=>$minimum,'location_id'=>Location::where('name',$location)->value('id'),'purchase_price'=>$price]);
        }

        $supplier = Supplier::firstOrCreate(['email'=>'ventas@segurimax.cl'], ['name'=>'Segurimax S.A.','category'=>'EPP / seguridad','contact_name'=>'Laura Fernández','phone'=>'+56 9 4567 8890','rating'=>4.9,'status'=>'Activo']);
        if (! $supplier->products()->exists()) $supplier->products()->sync(Product::whereIn('sku',['EPP-GUA-005','EPP-CAS-001'])->pluck('id'));
        $client = Client::firstOrCreate(['email'=>'contacto@losrobles.cl'], ['name'=>'Edificio Los Robles','contact_name'=>'Recepción','address'=>'Santiago']);
        Service::firstOrCreate(['title'=>'Capacitación brigada de emergencias','client_id'=>$client->id], ['location'=>'Sala de reuniones 2','scheduled_at'=>now()->addWeek(),'type'=>'Capacitación','status'=>'Programado','notes'=>'Incluye evacuación y uso de extintores.','created_by'=>$admin->id]);

        $extinguisher=Product::where('sku','EXT-ABC-006')->first();
        ProductBatch::firstOrCreate(['product_id'=>$extinguisher->id,'lot_number'=>'LOTE-DEMO-001'],['serial_number'=>'EXT-DEMO-001','quantity'=>1,'expiration_date'=>now()->addMonths(6)->toDateString(),'next_inspection_at'=>now()->addMonth()->toDateString(),'status'=>'Activo','notes'=>'Lote demostrativo para trazabilidad.']);
        $order=PurchaseOrder::where('notes','Orden demostrativa idempotente.')->first();
        if(!$order){$order=PurchaseOrder::create(['folio'=>app(FolioService::class)->next('OC'),'supplier_id'=>$supplier->id,'order_date'=>now()->toDateString(),'expected_date'=>now()->addDays(10)->toDateString(),'status'=>'Enviada','notes'=>'Orden demostrativa idempotente.','total'=>70000,'created_by'=>$admin->id,'approved_by'=>$admin->id]); $order->items()->create(['product_id'=>$extinguisher->id,'ordered_quantity'=>2,'received_quantity'=>0,'unit_price'=>35000]);}

        $this->seedDemoOperations($admin);
        $this->seedDemoAttachment($admin);
    }

    private function seedDemoAttachment(User $admin): void
    {
        $service = Service::where('title', 'Inspección mensual de extintores')->first();
        if (! $service) return;

        $path = 'attachments/services/informe-inspeccion-demostrativo.pdf';
        $disk = Storage::disk('local');
        if (! $disk->exists($path)) $disk->put($path, $this->demoPdf());

        Attachment::firstOrCreate([
            'entity_type' => 'services',
            'entity_id' => $service->id,
            'original_name' => 'informe-inspeccion-demostrativo.pdf',
        ], [
            'path' => $path,
            'mime' => 'application/pdf',
            'size' => $disk->size($path),
            'uploaded_by' => $admin->id,
        ]);
    }

    private function demoPdf(): string
    {
        $lines = [
            'DOCUMENTO DEMOSTRATIVO',
            'JESegurity - Evidencia de servicio',
            'Inspeccion mensual de extintores',
            'Cliente: Industrias del Sur S.A.',
            'Estado: Completado',
            'Muestra visual; no corresponde a una inspeccion real.',
        ];
        $stream = "BT\n/F1 16 Tf\n50 740 Td\n";
        foreach ($lines as $index => $line) {
            if ($index > 0) $stream .= "0 -32 Td\n";
            $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $line);
            $stream .= "({$escaped}) Tj\n";
        }
        $stream .= "ET\n";

        $objects = [
            "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
            "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
            "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj",
            "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
            "5 0 obj\n<< /Length ".strlen($stream)." >>\nstream\n{$stream}endstream\nendobj",
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object."\n";
        }
        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 6\n0000000000 65535 f \n";
        for ($index = 1; $index < count($offsets); $index++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$index]);
        }

        return $pdf."trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF";
    }

    private function seedDemoOperations(User $admin): void
    {
        foreach (['Detección', 'Rescate'] as $name) Category::firstOrCreate(['name' => $name]);
        foreach (['Equipos electrónicos', 'Zona de despacho'] as $name) Location::firstOrCreate(['name' => $name]);

        $products = [
            ['Detector de humo fotoeléctrico', 'DET-HUM-001', 'Detección', 'unidades', 18, 8, 'Equipos electrónicos', 18500],
            ['Botiquín industrial 50 personas', 'BOT-IND-050', 'Botiquines', 'unidades', 7, 5, 'Almacén principal', 46500],
            ['Arnés de seguridad 4 argollas', 'RES-ARN-004', 'Rescate', 'unidades', 11, 6, 'Almacén principal', 72000],
            ['Lentes de seguridad transparentes', 'EPP-LEN-001', 'EPP', 'unidades', 64, 25, 'EPP / Estantería A', 3900],
            ['Chaleco reflectante alta visibilidad', 'EPP-CHA-002', 'EPP', 'unidades', 29, 15, 'EPP / Estantería B', 7900],
            ['Cinta de demarcación rojo/blanco', 'SEN-CIN-003', 'Señalización', 'rollos', 16, 10, 'Señalización', 5200],
        ];
        foreach ($products as [$name,$sku,$category,$unit,$quantity,$minimum,$location,$price]) {
            Product::firstOrCreate(['sku'=>$sku], ['name'=>$name,'category_id'=>Category::where('name',$category)->value('id'),'unit'=>$unit,'quantity'=>$quantity,'minimum_quantity'=>$minimum,'location_id'=>Location::where('name',$location)->value('id'),'purchase_price'=>$price]);
        }

        $staff = [
            ['supervisor@jesegurity.com', 'Camila Soto', 'Supervisor', '+56 9 6123 4401', 'Operaciones', 'Sede central', 'Disponible', 'Turno A', 4.8, ['Coordinación', 'Emergencias', 'Auditoría']],
            ['operador@jesegurity.com', 'Diego Morales', 'Operador', '+56 9 5344 1180', 'Bodega', 'Almacén principal', 'Disponible', 'Turno A', 4.6, ['Inventario', 'Despacho']],
            ['valentina.rios@jesegurity.com', 'Valentina Ríos', 'Técnico', '+56 9 7321 5090', 'Mantenimiento', 'Sede central', 'En campo', 'Turno A', 4.9, ['Extintores', 'Detección', 'Recargas']],
            ['tomas.herrera@jesegurity.com', 'Tomás Herrera', 'Inspector', '+56 9 6678 2204', 'Prevención', 'Sede central', 'Disponible', 'Turno B', 4.7, ['Inspección', 'Señalización', 'Riesgos']],
            ['paula.vergara@jesegurity.com', 'Paula Vergara', 'Técnico', '+56 9 8450 3177', 'Capacitación', 'Sede central', 'Capacitación', 'Turno B', 4.8, ['Primeros auxilios', 'Evacuación', 'Brigadas']],
        ];
        foreach ($staff as [$email,$name,$role,$phone,$department,$location,$status,$shift,$rating,$skills]) {
            User::firstOrCreate(['email'=>$email], ['role_id'=>Role::where('name',$role)->value('id'),'full_name'=>$name,'password_hash'=>Hash::make('123456'),'phone'=>$phone,'department'=>$department,'location'=>$location,'status'=>$status,'shift'=>$shift,'rating'=>$rating,'skills'=>$skills]);
        }

        $suppliers = [
            ['compras@proteccionplus.cl', 'Protección Plus Ltda.', 'Extintores y recargas', 'Javier Márquez', '+56 2 2455 8700', 4.7, 'Activo', ['EXT-ABC-006','EXT-CO2-005']],
            ['ventas@senalesnorte.cl', 'Señales Norte SpA', 'Señalización industrial', 'Patricia Solís', '+56 9 2100 5587', 4.5, 'Activo', ['SEN-SAL-002','SEN-CIN-003']],
            ['contacto@firetech.cl', 'FireTech Sistemas', 'Detección y alarmas', 'Andrés Molina', '+56 2 2677 9012', 4.8, 'Activo', ['DET-HUM-001']],
            ['pedidos@rescateindustrial.cl', 'Rescate Industrial Chile', 'Trabajo en altura', 'Fernanda Lagos', '+56 9 4560 7712', 4.6, 'En revisión', ['RES-ARN-004']],
            ['ventas@mediseg.cl', 'MediSeg Equipamiento', 'Primeros auxilios', 'Claudio Vera', '+56 2 2890 4420', 4.9, 'Activo', ['BOT-IND-050']],
        ];
        foreach ($suppliers as [$email,$name,$category,$contact,$phone,$rating,$status,$skus]) {
            $supplier=Supplier::firstOrCreate(['email'=>$email], ['name'=>$name,'category'=>$category,'contact_name'=>$contact,'phone'=>$phone,'rating'=>$rating,'status'=>$status]);
            if (! $supplier->products()->exists()) $supplier->products()->sync(Product::whereIn('sku',$skus)->pluck('id'));
        }

        $clients = [
            ['prevencion@industriassur.cl', 'Industrias del Sur S.A.', 'Marcela Fuentes', '+56 2 2310 8840', 'Av. Industrial 1850, Santiago'],
            ['administracion@torresdelparque.cl', 'Torres del Parque', 'Rodrigo Silva', '+56 9 7740 2291', 'Av. Providencia 2240, Santiago'],
            ['operaciones@logisticacentral.cl', 'Logística Central', 'Carolina Méndez', '+56 2 2788 6510', 'Camino Lo Boza 9200, Pudahuel'],
            ['seguridad@colegiosannicolas.cl', 'Colegio San Nicolás', 'Verónica Castro', '+56 2 2431 6670', 'Los Alerces 450, Ñuñoa'],
            ['mantencion@mallcostanorte.cl', 'Centro Comercial Costa Norte', 'Felipe Araya', '+56 9 6120 8834', 'Costanera Norte 3210, Santiago'],
            ['contacto@constructorahorizonte.cl', 'Constructora Horizonte', 'Alejandro Peña', '+56 9 5567 1420', 'Obra Parque Central, Estación Central'],
        ];
        foreach ($clients as [$email,$name,$contact,$phone,$address]) Client::firstOrCreate(['email'=>$email], ['name'=>$name,'contact_name'=>$contact,'phone'=>$phone,'address'=>$address]);

        $services = [
            ['Inspección mensual de extintores', 'Industrias del Sur S.A.', -8, 9, 'Mantenimiento', 'Completado', 'Revisión de presión, sellos, señalización y accesibilidad.', ['valentina.rios@jesegurity.com','tomas.herrera@jesegurity.com']],
            ['Capacitación de uso de extintores', 'Colegio San Nicolás', 2, 10, 'Capacitación', 'Programado', 'Sesión práctica para docentes y personal administrativo.', ['paula.vergara@jesegurity.com','valentina.rios@jesegurity.com']],
            ['Auditoría de rutas de evacuación', 'Torres del Parque', 5, 15, 'Prevención', 'Programado', 'Levantamiento en tres torres y estacionamientos subterráneos.', ['tomas.herrera@jesegurity.com']],
            ['Mantenimiento de red húmeda', 'Centro Comercial Costa Norte', 8, 8, 'Mantenimiento', 'Pendiente', 'Pruebas de caudal, gabinetes y mangueras por nivel.', ['valentina.rios@jesegurity.com']],
            ['Formación de brigada de emergencia', 'Logística Central', 12, 9, 'Capacitación', 'Programado', 'Evacuación, comunicaciones y primera respuesta.', ['paula.vergara@jesegurity.com','tomas.herrera@jesegurity.com']],
            ['Inspección preventiva de obra', 'Constructora Horizonte', 15, 11, 'Prevención', 'Programado', 'Control de EPP, señalización y trabajo en altura.', ['tomas.herrera@jesegurity.com']],
            ['Simulacro general de evacuación', 'Industrias del Sur S.A.', 19, 14, 'Capacitación', 'Programado', 'Simulacro coordinado con jefaturas y brigadistas.', ['paula.vergara@jesegurity.com','tomas.herrera@jesegurity.com']],
            ['Revisión de detectores de humo', 'Torres del Parque', 25, 9, 'Mantenimiento', 'Programado', 'Prueba funcional y limpieza de detectores en áreas comunes.', ['valentina.rios@jesegurity.com']],
            ['Matriz de riesgos operacionales', 'Logística Central', 32, 10, 'Prevención', 'Pendiente', 'Actualización anual de peligros y controles críticos.', ['supervisor@jesegurity.com','tomas.herrera@jesegurity.com']],
            ['Taller de primeros auxilios', 'Colegio San Nicolás', 40, 9, 'Capacitación', 'Programado', 'Atención inicial, RCP y manejo de botiquín.', ['paula.vergara@jesegurity.com']],
        ];
        foreach ($services as [$title,$clientName,$days,$hour,$type,$status,$notes,$emails]) {
            $client=Client::where('name',$clientName)->first();
            $service=Service::firstOrCreate(['title'=>$title,'client_id'=>$client->id], ['location'=>$client->address,'scheduled_at'=>now()->startOfDay()->addDays($days)->addHours($hour),'type'=>$type,'status'=>$status,'notes'=>$notes,'created_by'=>$admin->id]);
            if (! $service->assignedUsers()->exists()) $service->assignedUsers()->sync(User::whereIn('email',$emails)->pluck('id'));
        }

        $batches = [
            ['EPP-GUA-005','GUA-2026-04',null,30,120,45,'Activo'],
            ['EPP-CAS-001','CAS-2024-11','CAS-88421',5,-20,-30,'Vencido'],
            ['DET-HUM-001','DET-2026-02','DET-19004',12,240,18,'Activo'],
            ['RES-ARN-004','ARN-2025-08','ARN-73018',4,60,12,'Activo'],
            ['BOT-IND-050','BOT-2026-01',null,3,22,30,'Activo'],
            ['EPP-LEN-001','LEN-2026-07',null,40,365,null,'Activo'],
        ];
        foreach ($batches as [$sku,$lot,$serial,$quantity,$expirationDays,$inspectionDays,$status]) {
            $product=Product::where('sku',$sku)->first();
            ProductBatch::firstOrCreate(['product_id'=>$product->id,'lot_number'=>$lot], ['serial_number'=>$serial,'quantity'=>$quantity,'expiration_date'=>now()->addDays($expirationDays)->toDateString(),'next_inspection_at'=>$inspectionDays===null?null:now()->addDays($inspectionDays)->toDateString(),'status'=>$status,'notes'=>'Registro demostrativo para control preventivo.']);
        }

        $orders = [
            ['Compra mensual de EPP', 'Segurimax S.A.', -6, 4, 'Parcial', [['EPP-GUA-005',60,8500,30],['EPP-LEN-001',50,3900,0]]],
            ['Reposición de señalización', 'Señales Norte SpA', -2, 8, 'Enviada', [['SEN-SAL-002',20,6500,0],['SEN-CIN-003',12,5200,0]]],
            ['Equipos para trabajo en altura', 'Rescate Industrial Chile', 0, 14, 'Borrador', [['RES-ARN-004',6,72000,0]]],
        ];
        foreach ($orders as [$note,$supplierName,$orderDays,$expectedDays,$status,$items]) {
            if (PurchaseOrder::where('notes',$note)->exists()) continue;
            $supplier=Supplier::where('name',$supplierName)->first();
            $total=collect($items)->sum(fn($item)=>$item[1]*$item[2]);
            $order=PurchaseOrder::create(['folio'=>app(FolioService::class)->next('OC'),'supplier_id'=>$supplier->id,'order_date'=>now()->addDays($orderDays)->toDateString(),'expected_date'=>now()->addDays($expectedDays)->toDateString(),'status'=>$status,'notes'=>$note,'total'=>$total,'created_by'=>$admin->id,'approved_by'=>$status==='Borrador'?null:$admin->id]);
            foreach ($items as [$sku,$ordered,$price,$received]) $order->items()->create(['product_id'=>Product::where('sku',$sku)->value('id'),'ordered_quantity'=>$ordered,'received_quantity'=>$received,'unit_price'=>$price]);
        }

        $movements = [
            ['Salida para capacitación Colegio San Nicolás','out','Colegio San Nicolás','EPP-GUA-005',12],
            ['Ingreso pendiente FireTech','in','FireTech Sistemas','DET-HUM-001',20],
            ['Ajuste por conteo de bodega','adjustment','Almacén principal','SEN-CIN-003',18],
        ];
        foreach ($movements as $index => [$reference,$type,$origin,$sku,$quantity]) {
            if (InventoryMovement::where('reference',$reference)->exists()) continue;
            $movement=InventoryMovement::create(['folio'=>app(FolioService::class)->next('MOV'),'type'=>$type,'reference'=>$reference,'origin'=>$origin,'status'=>'Pendiente','movement_date'=>now()->subDays($index+1),'created_by'=>User::where('email','operador@jesegurity.com')->value('id')]);
            $movement->items()->create(['product_id'=>Product::where('sku',$sku)->value('id'),'quantity'=>$quantity]);
        }
    }
}
