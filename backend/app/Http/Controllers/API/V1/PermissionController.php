<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index()
    {
        $permissions = Permission::orderBy('module')->orderBy('name')->get();

        $grouped = $permissions->groupBy('module');

        return response()->json([
            'data' => $permissions,
            'grouped' => $grouped,
        ]);
    }
}
