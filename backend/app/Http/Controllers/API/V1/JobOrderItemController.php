<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\JobOrder;
use App\Models\JobOrderItem;
use App\Models\Inventory;
use Illuminate\Http\Request;

class JobOrderItemController extends Controller
{
    public function index($jobOrderId)
    {
        $items = JobOrderItem::where('job_order_id', $jobOrderId)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'data' => $items
        ]);
    }

    public function store(Request $request, $jobOrderId)
    {
        $validated = $request->validate([
            'item_type' => 'required|string',
            'description' => 'required|string',
            'quantity' => 'required|numeric|min:0.01',
            'unit_price' => 'required|numeric|min:0',
            'inventory_id' => 'nullable',
        ]);

        $totalPrice = round((float)$validated['quantity'] * (float)$validated['unit_price'], 2);

        $inventoryId = !empty($validated['inventory_id']) ? (int)$validated['inventory_id'] : null;

        $item = JobOrderItem::create([
            'job_order_id' => $jobOrderId,
            'inventory_id' => $inventoryId,
            'item_type' => $validated['item_type'] ?? 'part',
            'description' => $validated['description'],
            'quantity' => $validated['quantity'],
            'unit_price' => $validated['unit_price'],
            'total_price' => $totalPrice,
        ]);

        // If it's a part with inventory_id, decrement stock
        if ($item->item_type === 'part' && $inventoryId) {
            $inv = Inventory::find($inventoryId);
            if ($inv) {
                $inv->decrement('stock_quantity', (int)$validated['quantity']);
            }
        }

        // Update actual_cost in job order
        $jobOrder = JobOrder::find($jobOrderId);
        if ($jobOrder) {
            $totalActual = JobOrderItem::where('job_order_id', $jobOrderId)->sum('total_price');
            $jobOrder->update(['actual_cost' => $totalActual]);
        }

        return response()->json([
            'data' => $item
        ], 201);
    }

    public function destroy($itemId)
    {
        $item = JobOrderItem::findOrFail($itemId);
        $jobOrderId = $item->job_order_id;

        // If it's a part, restore stock
        if ($item->item_type === 'part' && $item->inventory_id) {
            $inv = Inventory::find($item->inventory_id);
            if ($inv) {
                $inv->increment('stock_quantity', (int)$item->quantity);
            }
        }

        $item->delete();

        // Update actual_cost in job order
        $jobOrder = JobOrder::find($jobOrderId);
        if ($jobOrder) {
            $totalActual = JobOrderItem::where('job_order_id', $jobOrderId)->sum('total_price');
            $jobOrder->update(['actual_cost' => $totalActual]);
        }

        return response()->json(null, 204);
    }
}
