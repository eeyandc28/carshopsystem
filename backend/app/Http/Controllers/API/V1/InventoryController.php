<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\DeliveryItem;
use App\Models\JobOrderItem;
use App\Http\Resources\V1\InventoryResource;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->get('per_page', 10), 500);
        return InventoryResource::collection(Inventory::with('supplier')->latest()->paginate($perPage));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'part_number'    => 'required|string|unique:inventories,part_number',
            'brand'          => 'required|string',
            'supplier_id'    => 'nullable|exists:suppliers,id',
            'stock_quantity' => 'required|integer|min:0',
            'reorder_level'  => 'required|integer|min:0',
            'unit_price'     => 'required|numeric|min:0',
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
            'name'           => 'sometimes|required|string|max:255',
            'part_number'    => 'sometimes|required|string|unique:inventories,part_number,' . $inventory->id,
            'brand'          => 'sometimes|required|string',
            'supplier_id'    => 'nullable|exists:suppliers,id',
            'stock_quantity' => 'sometimes|required|integer|min:0',
            'reorder_level'  => 'sometimes|required|integer|min:0',
            'unit_price'     => 'sometimes|required|numeric|min:0',
        ]);

        $inventory->update($validated);

        return new InventoryResource($inventory);
    }

    public function destroy(Inventory $inventory)
    {
        $inventory->delete();

        return response()->json(null, 204);
    }

    /**
     * Reconstruct stock movement history from delivery_items (IN)
     * and job_order_items (OUT) for the given inventory item.
     */
    public function movements(Request $request, $id)
    {
        $inventory = Inventory::findOrFail($id);

        // ── Deliveries IN ────────────────────────────────────────────────────
        $deliveryItems = DeliveryItem::with('delivery.supplier')
            ->where('inventory_id', $id)
            ->when($request->start_date, fn($q) => $q->whereHas('delivery', fn($q2) =>
                $q2->whereDate('received_date', '>=', $request->start_date)
            ))
            ->when($request->end_date, fn($q) => $q->whereHas('delivery', fn($q2) =>
                $q2->whereDate('received_date', '<=', $request->end_date)
            ))
            ->get()
            ->map(fn($di) => [
                'id'               => 'DI-' . $di->id,
                'transaction_type' => 'IN',
                'reference_type'   => 'Delivery',
                'reference_id'     => $di->delivery?->delivery_number ?? ('DLV-' . $di->delivery_id),
                'reference_label'  => $di->delivery?->supplier?->name ?? 'Supplier',
                'quantity'         => (int) $di->quantity_received,
                'unit_cost'        => (float) $di->unit_cost,
                'notes'            => $di->delivery?->reference_number
                    ? 'DR: ' . $di->delivery->reference_number
                    : null,
                'created_at'       => $di->delivery?->received_date
                    ? (is_string($di->delivery->received_date) ? $di->delivery->received_date . ' 00:00:00' : $di->delivery->received_date->format('Y-m-d') . ' 00:00:00')
                    : $di->created_at->toDateTimeString(),

            ]);

        // ── Job Order Items OUT ───────────────────────────────────────────────
        $jobOrderItems = JobOrderItem::with('jobOrder.vehicle.customer')
            ->where('inventory_id', $id)
            ->where('item_type', 'part')
            ->when($request->start_date, fn($q) => $q->whereHas('jobOrder', fn($q2) =>
                $q2->whereDate('created_at', '>=', $request->start_date)
            ))
            ->when($request->end_date, fn($q) => $q->whereHas('jobOrder', fn($q2) =>
                $q2->whereDate('created_at', '<=', $request->end_date)
            ))
            ->get()
            ->map(fn($ji) => [
                'id'               => 'JI-' . $ji->id,
                'transaction_type' => 'OUT',
                'reference_type'   => 'Job Order',
                'reference_id'     => $ji->jobOrder->job_order_number ?? $ji->job_order_id,
                'reference_label'  => $ji->jobOrder?->vehicle?->customer?->full_name ?? 'Customer',
                'quantity'         => (int) $ji->quantity,
                'unit_cost'        => (float) $ji->unit_price,
                'notes'            => $ji->description ?? null,
                'created_at'       => $ji->created_at->toDateTimeString(),
            ]);


        // ── Merge & sort chronologically ─────────────────────────────────────
        $movements = $deliveryItems
            ->concat($jobOrderItems)
            ->sortBy('created_at')
            ->values();

        // ── Compute running balance ───────────────────────────────────────────
        // We know the current stock. Walk backward from latest to oldest
        // to assign balance_after each row.
        $currentStock = (int) $inventory->stock_quantity;
        $movementsArr = $movements->toArray();
        $n = count($movementsArr);

        // Walk backwards: at the last row, balance_after = currentStock
        // Moving back: balance_before = balance_after ∓ quantity
        $balance = $currentStock;
        for ($i = $n - 1; $i >= 0; $i--) {
            $movementsArr[$i]['balance_after'] = $balance;
            if ($movementsArr[$i]['transaction_type'] === 'IN') {
                $balance -= $movementsArr[$i]['quantity']; // before IN, stock was lower
            } else {
                $balance += $movementsArr[$i]['quantity']; // before OUT, stock was higher
            }
        }

        // Reverse so newest is first for display
        $result = array_reverse($movementsArr);

        return response()->json([
            'data'          => array_values($result),
            'current_stock' => $currentStock,
            'total_in'      => $deliveryItems->sum('quantity'),
            'total_out'     => $jobOrderItems->sum('quantity'),
        ]);
    }
}

