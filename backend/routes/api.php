<?php

use App\Http\Controllers\{AttachmentController, AuditLogController, AuthController, CategoryController, ClientController, LocationController, MovementController, NotificationController, PasswordResetController, ProductBatchController, ProductController, ProductTraceController, ProfileController, PurchaseOrderController, ReportController, RoleController, SearchController, ServiceController, SupplierController, UserController};
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [PasswordResetController::class, 'forgot']);
Route::post('/reset-password', [PasswordResetController::class, 'reset']);
Route::options('/{any}', fn () => response('', 204))->where('any', '.*');

Route::middleware('auth.api')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::get('/search', SearchController::class);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'read']);
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll']);
    Route::get('/notification-preferences', [NotificationController::class, 'preferences']);
    Route::put('/notification-preferences', [NotificationController::class, 'updatePreferences']);
    Route::post('/notifications/refresh', [NotificationController::class, 'refresh']);
    Route::get('/product-batches', [ProductBatchController::class, 'index']);
    Route::get('/product-batches/{productBatch}', [ProductBatchController::class, 'show']);
    Route::get('/expirations/summary', [ProductBatchController::class, 'summary']);
    Route::get('/products/{product}/trace', [ProductTraceController::class, 'trace']);
    Route::get('/products/{product}/label', [ProductTraceController::class, 'label']);
    Route::get('/attachments', [AttachmentController::class, 'index']);
    Route::get('/attachments/{attachment}/download', [AttachmentController::class, 'download']);

    foreach (['products'=>ProductController::class,'categories'=>CategoryController::class,'locations'=>LocationController::class,'suppliers'=>SupplierController::class,'clients'=>ClientController::class,'services'=>ServiceController::class,'users'=>UserController::class,'roles'=>RoleController::class,'movements'=>MovementController::class] as $path=>$controller) {
        Route::get("/$path", [$controller, 'index']);
    }

    Route::middleware('role:Administrador')->group(function () {
        foreach (['categories'=>CategoryController::class,'locations'=>LocationController::class,'users'=>UserController::class,'roles'=>RoleController::class] as $path=>$controller) {
            $parameter=['categories'=>'category','locations'=>'location','users'=>'user','roles'=>'role'][$path];
            Route::post("/$path", [$controller, 'store']);
            Route::put("/$path/{{$parameter}}", [$controller, 'update']);
            Route::delete("/$path/{{$parameter}}", [$controller, 'destroy']);
        }
    });

    Route::middleware('role:Administrador,Supervisor')->group(function () {
        foreach (['products'=>ProductController::class,'suppliers'=>SupplierController::class,'clients'=>ClientController::class,'services'=>ServiceController::class] as $path=>$controller) {
            $parameter=['categories'=>'category','locations'=>'location','products'=>'product','suppliers'=>'supplier','clients'=>'client','services'=>'service'][$path] ?? rtrim($path,'s');
            Route::post("/$path", [$controller, 'store']);
            Route::put("/$path/{{$parameter}}", [$controller, 'update']);
            Route::delete("/$path/{{$parameter}}", [$controller, 'destroy']);
        }
        Route::put('/movements/{movement}', [MovementController::class, 'update']);
        Route::delete('/movements/{movement}', [MovementController::class, 'destroy']);
        Route::post('/movements/{movement}/approve', [MovementController::class, 'approve']);
        Route::post('/movements/{movement}/reject', [MovementController::class, 'reject']);
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::post('/product-batches', [ProductBatchController::class, 'store']);
        Route::put('/product-batches/{productBatch}', [ProductBatchController::class, 'update']);
        Route::delete('/product-batches/{productBatch}', [ProductBatchController::class, 'destroy']);
        Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
        Route::get('/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show']);
        Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);
        Route::put('/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'update']);
        Route::delete('/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy']);
        Route::post('/purchase-orders/{purchaseOrder}/send', [PurchaseOrderController::class, 'send']);
        Route::post('/purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve']);
        Route::post('/purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);
        Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
        Route::get('/reports/inventory', [ReportController::class, 'inventory']);
        Route::get('/reports/movements', [ReportController::class, 'movements']);
        Route::get('/reports/services', [ReportController::class, 'services']);
        Route::get('/reports/suppliers', [ReportController::class, 'suppliers']);
        Route::get('/reports/{report}/csv', [ReportController::class, 'csv']);
        Route::delete('/attachments/{attachment}', [AttachmentController::class, 'destroy']);
    });

    Route::post('/movements', [MovementController::class, 'store'])->middleware('role:Administrador,Supervisor,Operador');
    Route::post('/attachments', [AttachmentController::class, 'store'])->middleware('role:Administrador,Supervisor,Operador,Técnico,Inspector');
});
