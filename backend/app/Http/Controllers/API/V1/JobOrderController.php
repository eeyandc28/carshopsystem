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
            'service_advisor_id' => $request->user()?->id ?? 1,
            'complaint' => $validated['description'],
            'status' => 'pending',
            'estimated_completion' => $validated['promised_at'],
        ];

        $jobOrder = JobOrder::create($data);

        return new JobOrderResource($jobOrder);
    }

    public function show(JobOrder $jobOrder)
    {
        return new JobOrderResource($jobOrder->load(['vehicle.customer', 'serviceAdvisor', 'mechanic', 'payments']));
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
            self::restoreJobOrderInventoryStock($jobOrder);
        }

        // If reopening from cancelled
        if (isset($validated['status']) && $validated['status'] !== 'cancelled' && $jobOrder->status === 'cancelled') {
            $validated['cancelled_at'] = null;
            $validated['cancellation_reason'] = null;
            self::deductJobOrderInventoryStock($jobOrder);
        }

        $jobOrder->update($validated);

        return new JobOrderResource($jobOrder);
    }

    public function cancel(Request $request, JobOrder $jobOrder)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string',
        ]);

        if ($jobOrder->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending job orders can be cancelled.'
            ], 422);
        }

        if ($jobOrder->status !== 'cancelled') {
            self::restoreJobOrderInventoryStock($jobOrder);
        }

        $jobOrder->update([
            'status' => 'cancelled',
            'cancellation_reason' => $validated['reason'] ?? 'Cancelled by user',
            'cancelled_at' => now(),
        ]);

        return new JobOrderResource($jobOrder);
    }

    protected static function restoreJobOrderInventoryStock($jobOrder)
    {
        $items = \App\Models\JobOrderItem::where('job_order_id', $jobOrder->id)->get();
        foreach ($items as $item) {
            if ($item->inventory_id) {
                $inv = \App\Models\Inventory::find($item->inventory_id);
                if ($inv) {
                    $inv->increment('stock_quantity', (int)$item->quantity);
                }
            }

            // Restore any service inclusions
            $service = \App\Models\Service::whereRaw('LOWER(name) = ?', [strtolower(trim($item->description))])->first();
            if ($service && !empty($service->inclusions)) {
                $incs = is_array($service->inclusions) ? $service->inclusions : (json_decode($service->inclusions, true) ?: []);
                foreach ($incs as $inc) {
                    $incInvId = $inc['inventory_id'] ?? null;
                    if (!$incInvId && !empty($inc['name'])) {
                        $matchInv = \App\Models\Inventory::whereRaw('LOWER(name) = ?', [strtolower(trim($inc['name']))])->first();
                        if ($matchInv) $incInvId = $matchInv->id;
                    }
                    if ($incInvId) {
                        $incInv = \App\Models\Inventory::find($incInvId);
                        if ($incInv) {
                            $qty = (int)($inc['quantity'] ?? 1) * (int)$item->quantity;
                            $incInv->increment('stock_quantity', $qty);
                        }
                    }
                }
            }
        }
    }

    protected static function deductJobOrderInventoryStock($jobOrder)
    {
        $items = \App\Models\JobOrderItem::where('job_order_id', $jobOrder->id)->get();
        foreach ($items as $item) {
            if ($item->inventory_id) {
                $inv = \App\Models\Inventory::find($item->inventory_id);
                if ($inv) {
                    $inv->decrement('stock_quantity', (int)$item->quantity);
                }
            }

            // Deduct any service inclusions
            $service = \App\Models\Service::whereRaw('LOWER(name) = ?', [strtolower(trim($item->description))])->first();
            if ($service && !empty($service->inclusions)) {
                $incs = is_array($service->inclusions) ? $service->inclusions : (json_decode($service->inclusions, true) ?: []);
                foreach ($incs as $inc) {
                    $incInvId = $inc['inventory_id'] ?? null;
                    if (!$incInvId && !empty($inc['name'])) {
                        $matchInv = \App\Models\Inventory::whereRaw('LOWER(name) = ?', [strtolower(trim($inc['name']))])->first();
                        if ($matchInv) $incInvId = $matchInv->id;
                    }
                    if ($incInvId) {
                        $incInv = \App\Models\Inventory::find($incInvId);
                        if ($incInv) {
                            $qty = (int)($inc['quantity'] ?? 1) * (int)$item->quantity;
                            $incInv->decrement('stock_quantity', $qty);
                        }
                    }
                }
            }
        }
    }

    public function destroy(JobOrder $jobOrder)
    {
        $jobOrder->delete();

        return response()->json(null, 204);
    }
}
