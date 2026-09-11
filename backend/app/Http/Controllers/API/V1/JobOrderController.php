<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\JobOrder;
use App\Http\Resources\V1\JobOrderResource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class JobOrderController extends Controller
{
    public function index()
    {
        return JobOrderResource::collection(JobOrder::with(['vehicle.customer', 'serviceAdvisor'])->latest()->paginate(10));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'description' => 'required|string',
            'promised_at' => 'nullable|date',
        ]);

        $data = [
            'job_order_number' => 'JO-' . strtoupper(Str::random(8)),
            'vehicle_id' => $validated['vehicle_id'],
            'service_advisor_id' => $request->user()->id,
            'complaint' => $validated['description'],
            'status' => 'pending',
            'estimated_completion' => $validated['promised_at'],
        ];

        $jobOrder = JobOrder::create($data);

        return new JobOrderResource($jobOrder);
    }

    public function show(JobOrder $jobOrder)
    {
        return new JobOrderResource($jobOrder->load(['vehicle.customer', 'serviceAdvisor', 'mechanic']));
    }

    public function update(Request $request, JobOrder $jobOrder)
    {
        $validated = $request->validate([
            'status' => 'sometimes|required|in:pending,diagnosing,waiting_for_parts,in_progress,completed,released,cancelled',
            'description' => 'sometimes|required|string',
            'diagnosis' => 'nullable|string',
            'repair_action' => 'nullable|string',
            'promised_at' => 'nullable|date',
            'cancellation_reason' => 'nullable|string',
        ]);

        if (isset($validated['description'])) {
            $validated['complaint'] = $validated['description'];
        }
        if (isset($validated['promised_at'])) {
            $validated['estimated_completion'] = $validated['promised_at'];
        }

        // If transitioning to cancelled
        if (isset($validated['status']) && $validated['status'] === 'cancelled' && $jobOrder->status !== 'cancelled') {
            $validated['cancelled_at'] = now();
            $items = \App\Models\JobOrderItem::where('job_order_id', $jobOrder->id)
                ->where('item_type', 'part')
                ->whereNotNull('inventory_id')
                ->get();

            foreach ($items as $item) {
                $inv = \App\Models\Inventory::find($item->inventory_id);
                if ($inv) {
                    $inv->increment('stock_quantity', (int)$item->quantity);
                }
            }
        }

        // If reopening from cancelled
        if (isset($validated['status']) && $validated['status'] !== 'cancelled' && $jobOrder->status === 'cancelled') {
            $validated['cancelled_at'] = null;
            $validated['cancellation_reason'] = null;
            $items = \App\Models\JobOrderItem::where('job_order_id', $jobOrder->id)
                ->where('item_type', 'part')
                ->whereNotNull('inventory_id')
                ->get();

            foreach ($items as $item) {
                $inv = \App\Models\Inventory::find($item->inventory_id);
                if ($inv) {
                    $inv->decrement('stock_quantity', (int)$item->quantity);
                }
            }
        }

        $jobOrder->update($validated);

        return new JobOrderResource($jobOrder);
    }

    public function cancel(Request $request, JobOrder $jobOrder)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string',
        ]);

        if ($jobOrder->status !== 'cancelled') {
            $items = \App\Models\JobOrderItem::where('job_order_id', $jobOrder->id)
                ->where('item_type', 'part')
                ->whereNotNull('inventory_id')
                ->get();

            foreach ($items as $item) {
                $inv = \App\Models\Inventory::find($item->inventory_id);
                if ($inv) {
                    $inv->increment('stock_quantity', (int)$item->quantity);
                }
            }
        }

        $jobOrder->update([
            'status' => 'cancelled',
            'cancellation_reason' => $validated['reason'] ?? 'Cancelled by user',
            'cancelled_at' => now(),
        ]);

        return new JobOrderResource($jobOrder);
    }

    public function destroy(JobOrder $jobOrder)
    {
        $jobOrder->delete();

        return response()->json(null, 204);
    }
}
