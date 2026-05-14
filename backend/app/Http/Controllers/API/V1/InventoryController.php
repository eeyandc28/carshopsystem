<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Http\Resources\V1\InventoryResource;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index()
    {
        return InventoryResource::collection(Inventory::with('supplier')->latest()->paginate(10));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'part_number' => 'required|string|unique:inventories,part_number',
            'brand' => 'required|string',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'stock_quantity' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
            'unit_price' => 'required|numeric|min:0',
        ]);

        $inventory = Inventory::create($validated);

        return new InventoryResource($inventory);
    }

    public function show(Inventory $inventory)
    {
        return new InventoryResource($inventory->load('supplier'));
    }

    public function update(Request $request, Inventory $inventory)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'part_number' => 'sometimes|required|string|unique:inventories,part_number,'.$inventory->id,
            'brand' => 'sometimes|required|string',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'stock_quantity' => 'sometimes|required|integer|min:0',
            'reorder_level' => 'sometimes|required|integer|min:0',
            'unit_price' => 'sometimes|required|numeric|min:0',
        ]);

        $inventory->update($validated);

        return new InventoryResource($inventory);
    }

    public function destroy(Inventory $inventory)
    {
        $inventory->delete();

        return response()->json(null, 204);
    }
}
