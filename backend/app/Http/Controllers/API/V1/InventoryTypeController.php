<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\InventoryType;
use Illuminate\Http\Request;

class InventoryTypeController extends Controller
{
    public function index()
    {
        $types = InventoryType::withCount('inventories')->orderBy('name')->get();
        return response()->json(['data' => $types]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:inventory_types,name',
            'description' => 'nullable|string|max:500',
        ]);

        $type = InventoryType::create($validated);

        return response()->json([
            'message' => 'Inventory type created successfully',
            'data'    => $type,
        ], 201);
    }

    public function update(Request $request, InventoryType $inventoryType)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:inventory_types,name,' . $inventoryType->id,
            'description' => 'nullable|string|max:500',
        ]);

        // Also update the type string on existing inventory items so grouping stays consistent
        if ($inventoryType->name !== $validated['name']) {
            \App\Models\Inventory::where('type', $inventoryType->name)
                ->update(['type' => $validated['name']]);
        }

        $inventoryType->update($validated);

        return response()->json([
            'message' => 'Inventory type updated successfully',
            'data'    => $inventoryType,
        ]);
    }

    public function destroy(InventoryType $inventoryType)
    {
        $inventoryType->delete();
        return response()->json(['message' => 'Inventory type deleted successfully'], 200);
    }
}
