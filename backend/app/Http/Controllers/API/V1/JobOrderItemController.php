<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\JobOrder;
use App\Models\JobOrderItem;
use App\Models\Inventory;
use App\Models\Service;
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

        // Auto-match inventory if inventory_id was not explicitly passed
        if (!$inventoryId) {
            $invMatch = Inventory::whereRaw('LOWER(name) = ?', [strtolower(trim($validated['description']))])
                ->orWhereRaw('LOWER(part_number) = ?', [strtolower(trim($validated['description']))])
                ->first();
            if ($invMatch) {
                $inventoryId = $invMatch->id;
            }
        }

        $item = JobOrderItem::create([
            'job_order_id' => $jobOrderId,
            'inventory_id' => $inventoryId,
            'item_type' => $validated['item_type'] ?? 'part',
            'description' => $validated['description'],
            'quantity' => $validated['quantity'],
            'unit_price' => $validated['unit_price'],
            'total_price' => $totalPrice,
        ]);

        // Decrement stock for inventory item
        if ($inventoryId) {
            $inv = Inventory::find($inventoryId);
            if ($inv) {
                $inv->decrement('stock_quantity', (int)$validated['quantity']);
            }
        }

        // If this item is a Service with package inclusions, deduct inventory for those inclusions
        $service = Service::whereRaw('LOWER(name) = ?', [strtolower(trim($validated['description']))])->first();
        if ($service && !empty($service->inclusions)) {
            $inclusions = is_array($service->inclusions) ? $service->inclusions : (json_decode($service->inclusions, true) ?: []);
            foreach ($inclusions as $inc) {
                $incInvId = $inc['inventory_id'] ?? null;
                if (!$incInvId && !empty($inc['name'])) {
                    $matchInv = Inventory::whereRaw('LOWER(name) = ?', [strtolower(trim($inc['name']))])->first();
                    if ($matchInv) $incInvId = $matchInv->id;
                }
                if ($incInvId) {
                    $incInv = Inventory::find($incInvId);
                    if ($incInv) {
                        $qtyToDeduct = (int)($inc['quantity'] ?? 1) * (int)$validated['quantity'];
                        $incInv->decrement('stock_quantity', $qtyToDeduct);
                    }
                }
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

        // 1. If it has direct inventory_id, restore stock
        if ($item->inventory_id) {
            $inv = Inventory::find($item->inventory_id);
            if ($inv) {
                $inv->increment('stock_quantity', (int)$item->quantity);
            }
        }

        // 2. Cascade delete any child package inclusions belonging to this item in the same job order
        $includedChildItems = JobOrderItem::where('job_order_id', $jobOrderId)
            ->where('id', '!=', $item->id)
            ->where(function ($q) use ($item) {
                $q->where('description', 'like', "%(Included with {$item->description})%")
                  ->orWhere('description', 'like', "%[Included with {$item->description}]%");
            })
            ->get();

        foreach ($includedChildItems as $child) {
            if ($child->inventory_id) {
                $cInv = Inventory::find($child->inventory_id);
                if ($cInv) {
                    $cInv->increment('stock_quantity', (int)$child->quantity);
                }
            }
            $child->delete();
        }

        // 3. If it was a service with catalog package inclusions, and inclusions were NOT separate rows, restore stock
        if ($includedChildItems->isEmpty()) {
            $service = Service::whereRaw('LOWER(name) = ?', [strtolower(trim($item->description))])->first();
            if ($service && !empty($service->inclusions)) {
                $inclusions = is_array($service->inclusions) ? $service->inclusions : (json_decode($service->inclusions, true) ?: []);
                foreach ($inclusions as $inc) {
                    $incInvId = $inc['inventory_id'] ?? null;
                    if (!$incInvId && !empty($inc['name'])) {
                        $matchInv = Inventory::whereRaw('LOWER(name) = ?', [strtolower(trim($inc['name']))])->first();
                        if ($matchInv) $incInvId = $matchInv->id;
                    }
                    if ($incInvId) {
                        $incInv = Inventory::find($incInvId);
                        if ($incInv) {
                            $qtyToRestore = (int)($inc['quantity'] ?? 1) * (int)$item->quantity;
                            $incInv->increment('stock_quantity', $qtyToRestore);
                        }
                    }
                }
            }
        }

        $item->delete();

        // 4. Update actual_cost in job order
        $jobOrder = JobOrder::find($jobOrderId);
        if ($jobOrder) {
            $totalActual = JobOrderItem::where('job_order_id', $jobOrderId)->sum('total_price');
            $jobOrder->update(['actual_cost' => $totalActual]);
        }

        return response()->json(null, 204);
    }
}
