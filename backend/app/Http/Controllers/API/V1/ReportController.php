<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\JobOrder;
use App\Models\JobOrderItem;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Sales Income Report
     */
    public function sales(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate   = $request->get('end_date', now()->toDateString());

        $orders = JobOrder::with(['vehicle.customer'])
            ->whereIn('status', ['completed', 'released'])
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->orderByDesc('created_at')
            ->get();

        $totalSales = $orders->sum(fn($o) => (float) $o->actual_cost);
        $totalOrders = $orders->count();

        return response()->json([
            'data'    => $orders,
            'summary' => [
                'total_sales'          => $totalSales,
                'total_orders'         => $totalOrders,
                'average_order_value'  => $totalOrders > 0 ? round($totalSales / $totalOrders, 2) : 0,
            ],
        ]);
    }

    /**
     * Fast & Slow Moving Items Report
     *
     * Analyses item movement based on quantity consumed via job order items
     * within the given date range. Items are classified as:
     *   - fast  : top 33% by total quantity used
     *   - slow  : bottom 33% by total quantity used
     *   - normal: middle 34%
     */
    public function itemMovement(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate   = $request->get('end_date', now()->toDateString());

        // Aggregate quantity consumed per inventory item within date range
        $consumed = JobOrderItem::select(
                'inventory_id',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(total_price) as total_value'),
                DB::raw('COUNT(*) as usage_count')
            )
            ->whereNotNull('inventory_id')
            ->where('item_type', 'part')
            ->whereHas('jobOrder', function ($q) use ($startDate, $endDate) {
                $q->whereDate('created_at', '>=', $startDate)
                  ->whereDate('created_at', '<=', $endDate);
            })
            ->groupBy('inventory_id')
            ->orderByDesc('total_quantity')
            ->get()
            ->keyBy('inventory_id');

        // Load all inventory items so items with zero usage also appear
        $inventories = Inventory::with('supplier')->get();

        // Merge usage data into inventory list
        $items = $inventories->map(function ($inv) use ($consumed) {
            $usage = $consumed->get($inv->id);
            return [
                'id'             => $inv->id,
                'name'           => $inv->name,
                'part_number'    => $inv->part_number,
                'brand'          => $inv->brand,
                'supplier'       => $inv->supplier?->name ?? 'N/A',
                'stock_quantity' => $inv->stock_quantity,
                'unit_price'     => (float) $inv->unit_price,
                'total_quantity' => $usage ? (float) $usage->total_quantity : 0,
                'total_value'    => $usage ? (float) $usage->total_value    : 0,
                'usage_count'    => $usage ? (int)   $usage->usage_count    : 0,
                'classification' => 'normal', // will be assigned below
            ];
        })->sortByDesc('total_quantity')->values();

        // Classify: top 33% = fast, bottom 33% = slow, rest = normal
        $count = $items->count();
        if ($count > 0) {
            $fastThreshold = max(1, (int) ceil($count * 0.33));
            $slowStart     = max($fastThreshold, $count - (int) ceil($count * 0.33));

            $items = $items->map(function ($item, $index) use ($fastThreshold, $slowStart) {
                if ($item['total_quantity'] === 0) {
                    $item['classification'] = 'slow';
                } elseif ($index < $fastThreshold) {
                    $item['classification'] = 'fast';
                } elseif ($index >= $slowStart) {
                    $item['classification'] = 'slow';
                } else {
                    $item['classification'] = 'normal';
                }
                return $item;
            });
        }

        $fast   = $items->where('classification', 'fast')->values();
        $slow   = $items->where('classification', 'slow')->values();
        $normal = $items->where('classification', 'normal')->values();

        return response()->json([
            'data' => $items,
            'summary' => [
                'total_items'       => $count,
                'fast_moving_count' => $fast->count(),
                'slow_moving_count' => $slow->count(),
                'normal_count'      => $normal->count(),
                'total_value_moved' => round($items->sum('total_value'), 2),
                'total_qty_moved'   => $items->sum('total_quantity'),
            ],
            'fast'   => $fast,
            'slow'   => $slow,
            'normal' => $normal,
        ]);
    }
}
