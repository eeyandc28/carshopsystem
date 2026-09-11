<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\V1\AuthController;
use App\Http\Controllers\API\V1\CustomerController;
use App\Http\Controllers\API\V1\VehicleController;
use App\Http\Controllers\API\V1\InventoryController;
use App\Http\Controllers\API\V1\JobOrderController;
use App\Http\Controllers\API\V1\JobOrderItemController;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'me']);
        
        Route::apiResource('customers', CustomerController::class);
        Route::apiResource('vehicles', VehicleController::class);
        Route::apiResource('inventory', InventoryController::class);
        Route::apiResource('job-orders', JobOrderController::class);
        Route::post('job-orders/{jobOrder}/cancel', [JobOrderController::class, 'cancel']);
        Route::get('job-orders/{jobOrder}/items', [JobOrderItemController::class, 'index']);
        Route::post('job-orders/{jobOrder}/items', [JobOrderItemController::class, 'store']);
        Route::delete('job-orders/items/{itemId}', [JobOrderItemController::class, 'destroy']);
        Route::apiResource('suppliers', \App\Http\Controllers\API\V1\SupplierController::class);
    });
});
