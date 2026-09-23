<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\V1\AuthController;
use App\Http\Controllers\API\V1\CustomerController;
use App\Http\Controllers\API\V1\VehicleController;
use App\Http\Controllers\API\V1\InventoryController;
use App\Http\Controllers\API\V1\JobOrderController;
use App\Http\Controllers\API\V1\JobOrderItemController;
use App\Http\Controllers\API\V1\ReportController;
use App\Http\Controllers\API\V1\DeliveryController;
use App\Http\Controllers\API\V1\PaymentController;
use App\Http\Controllers\API\V1\RoleController;
use App\Http\Controllers\API\V1\PermissionController;
use App\Http\Controllers\API\V1\AuditLogController;
use App\Http\Controllers\API\V1\UserController;
use App\Http\Controllers\API\V1\InventoryTypeController;
use App\Http\Controllers\API\V1\ServiceController;

Route::prefix('v1')->group(function () {
    Route::get('/login', function() { 
        return response()->json(['message' => 'Unauthenticated.'], 401); 
    })->name('login');

    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'me']);

        // Reports
        Route::get('/reports/sales', [ReportController::class, 'sales']);
        Route::get('/reports/item-movement', [ReportController::class, 'itemMovement']);
        Route::get('/reports/daily-income', [PaymentController::class, 'dailyIncome']);

        // Payments (Cashier)
        Route::get('/payments/unpaid', [PaymentController::class, 'unpaidJobOrders']);
        Route::post('/payments', [PaymentController::class, 'store']);
        Route::apiResource('customers', CustomerController::class);
        Route::apiResource('vehicles', VehicleController::class);
        Route::get('inventory/{id}/movements', [InventoryController::class, 'movements']);
        Route::apiResource('inventory', InventoryController::class);
        Route::apiResource('inventory-types', InventoryTypeController::class)->except(['show']);
        Route::apiResource('services', ServiceController::class)->except(['show']);

        Route::apiResource('job-orders', JobOrderController::class);
        Route::post('job-orders/{jobOrder}/cancel', [JobOrderController::class, 'cancel']);
        Route::get('job-orders/{jobOrder}/items', [JobOrderItemController::class, 'index']);
        Route::post('job-orders/{jobOrder}/items', [JobOrderItemController::class, 'store']);
        Route::delete('job-orders/items/{itemId}', [JobOrderItemController::class, 'destroy']);
        Route::apiResource('suppliers', \App\Http\Controllers\API\V1\SupplierController::class);

        // Deliveries (Receiving)
        Route::apiResource('deliveries', DeliveryController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

        // User Management
        Route::post('users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::patch('users/{id}/status', [UserController::class, 'updateStatus']);
        Route::apiResource('users', UserController::class);

        // Role & Permission Management
        Route::get('permissions', [PermissionController::class, 'index']);
        Route::apiResource('roles', RoleController::class);

        // Audit Logs
        Route::get('audit-logs', [AuditLogController::class, 'index']);

        // Web Push Notifications & Subscriptions
        Route::get('push/vapid-key', [\App\Http\Controllers\API\V1\PushSubscriptionController::class, 'getVapidKey']);
        Route::post('push/subscribe', [\App\Http\Controllers\API\V1\PushSubscriptionController::class, 'store']);
        Route::get('push/status', [\App\Http\Controllers\API\V1\PushSubscriptionController::class, 'status']);
        Route::delete('push/unsubscribe', [\App\Http\Controllers\API\V1\PushSubscriptionController::class, 'destroy']);
        Route::post('push/test', [\App\Http\Controllers\API\V1\PushSubscriptionController::class, 'testNotification']);
        Route::post('push-subscriptions', [\App\Http\Controllers\API\V1\PushSubscriptionController::class, 'store']);
        Route::delete('push-subscriptions', [\App\Http\Controllers\API\V1\PushSubscriptionController::class, 'destroy']);

        // In-App Notifications (Notification Bell)
        Route::get('notifications', [\App\Http\Controllers\API\V1\NotificationController::class, 'index']);
        Route::patch('notifications/{id}/read', [\App\Http\Controllers\API\V1\NotificationController::class, 'markAsRead']);
        Route::post('notifications/mark-all-read', [\App\Http\Controllers\API\V1\NotificationController::class, 'markAllAsRead']);
    });

});
