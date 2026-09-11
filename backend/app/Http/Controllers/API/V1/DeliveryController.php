<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\DeliveryItem;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeliveryController extends Controller
{
    /**
     * List all deliveries (paginated), latest first.
     */
    public function index(Request $request)
    {
        $query = Delivery::with(['supplier', 'receiver', 'items.inventory'])
            ->latest();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('delivery_number', 'like', "%{$s}%")
                  ->orWhere('reference_number', 'like', "%{$s}%")
                  ->orWhereHas('supplier', fn($q2) => $q2->where('name', 'like', "%{$s}%"));
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('received_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('received_date', '<=', $request->end_date);
        }

        $deliveries = $query->paginate(15);

        // Append computed totals
        $deliveries->getCollection()->transform(function ($d) {
            $d->total_cost  = $d->total_cost;
            $d->total_items = $d->total_items;
            return $d;
        });

        return response()->json($deliveries);
    }

    /**
     * Create a new delivery and increment inventory stock.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id'      => 'nullable|exists:suppliers,id',
            'received_date'    => 'required|date',
            'reference_number' => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
            'status'           => 'required|in:draft,received',
            'items'            => 'required|array|min:1',
            'items.*.inventory_id'     => 'required|exists:inventories,id',
            'items.*.quantity_received'=> 'required|integer|min:1',
            'items.*.unit_cost'        => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $request, &$delivery) {
            // Generate unique delivery number
            $deliveryNumber = $this->generateDeliveryNumber();

            $delivery = Delivery::create([
                'delivery_number'  => $deliveryNumber,
                'supplier_id'      => $validated['supplier_id'] ?? null,
                'received_by'      => $request->user()->id,
                'received_date'    => $validated['received_date'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes'            => $validated['notes'] ?? null,
                'status'           => $validated['status'],
            ]);

            foreach ($validated['items'] as $item) {
                $totalCost = $item['quantity_received'] * $item['unit_cost'];

                DeliveryItem::create([
                    'delivery_id'       => $delivery->id,
                    'inventory_id'      => $item['inventory_id'],
                    'quantity_received'  => $item['quantity_received'],
                    'unit_cost'         => $item['unit_cost'],
                    'total_cost'        => $totalCost,
                ]);

                // Automatically increment stock when status is received
                if ($validated['status'] === 'received') {
                    Inventory::where('id', $item['inventory_id'])
                        ->increment('stock_quantity', $item['quantity_received']);
                }
            }
        });

        return response()->json(
            $delivery->load(['supplier', 'receiver', 'items.inventory']),
            201
        );
    }

    /**
     * Show a single delivery with all items.
     */
    public function show(Delivery $delivery)
    {
        $delivery->load(['supplier', 'receiver', 'items.inventory.supplier']);
        $delivery->total_cost  = $delivery->total_cost;
        $delivery->total_items = $delivery->total_items;

        return response()->json($delivery);
    }

    /**
     * Update a delivery. Reverses old stock, resets items, applies new stock.
     */
    public function update(Request $request, Delivery $delivery)
    {
        $validated = $request->validate([
            'supplier_id'      => 'nullable|exists:suppliers,id',
            'received_date'    => 'required|date',
            'reference_number' => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
            'status'           => 'required|in:draft,received',
            'items'            => 'required|array|min:1',
            'items.*.inventory_id'      => 'required|exists:inventories,id',
            'items.*.quantity_received' => 'required|integer|min:1',
            'items.*.unit_cost'         => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $request, $delivery) {
            // 1. Reverse old stock if delivery was previously received
            if ($delivery->status === 'received') {
                foreach ($delivery->items as $oldItem) {
                    Inventory::where('id', $oldItem->inventory_id)
                        ->decrement('stock_quantity', $oldItem->quantity_received);
                }
            }

            // 2. Delete old line items
            $delivery->items()->delete();

            // 3. Update header
            $delivery->update([
                'supplier_id'      => $validated['supplier_id'] ?? null,
                'received_date'    => $validated['received_date'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes'            => $validated['notes'] ?? null,
                'status'           => $validated['status'],
            ]);

            // 4. Recreate items and apply new stock
            foreach ($validated['items'] as $item) {
                $totalCost = $item['quantity_received'] * $item['unit_cost'];

                DeliveryItem::create([
                    'delivery_id'      => $delivery->id,
                    'inventory_id'     => $item['inventory_id'],
                    'quantity_received' => $item['quantity_received'],
                    'unit_cost'        => $item['unit_cost'],
                    'total_cost'       => $totalCost,
                ]);

                if ($validated['status'] === 'received') {
                    Inventory::where('id', $item['inventory_id'])
                        ->increment('stock_quantity', $item['quantity_received']);
                }
            }
        });

        return response()->json(
            $delivery->fresh()->load(['supplier', 'receiver', 'items.inventory'])
        );
    }

    /**
     * Delete a delivery. If status is received, reverse the stock.
     */
    public function destroy(Delivery $delivery)
    {
        DB::transaction(function () use ($delivery) {
            if ($delivery->status === 'received') {
                foreach ($delivery->items as $item) {
                    Inventory::where('id', $item->inventory_id)
                        ->decrement('stock_quantity', $item->quantity_received);
                }
            }
            $delivery->delete();
        });

        return response()->json(null, 204);
    }

    /**
     * Generate a unique sequential delivery number: DLV-YYYYMMDD-XXXX
     */
    private function generateDeliveryNumber(): string
    {
        $prefix = 'DLV-' . now()->format('Ymd') . '-';
        $last   = Delivery::withTrashed()
            ->where('delivery_number', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->first();

        $seq = $last
            ? ((int) substr($last->delivery_number, -4)) + 1
            : 1;

        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}
