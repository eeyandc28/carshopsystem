<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\JobOrder;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Store a newly created payment.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'job_order_id'     => 'required|exists:job_orders,id',
            'amount'           => 'required|numeric|min:0',
            'discount'         => 'nullable|numeric|min:0',
            'payment_method'   => 'required|string',
            'reference_number' => 'nullable|string',
            'payment_date'     => 'required|date',
        ]);

        return DB::transaction(function () use ($validated) {
            $jo = JobOrder::findOrFail($validated['job_order_id']);
            $discount = (float)($validated['discount'] ?? 0);

            // Find or create associated invoice for job order
            $invoice = Invoice::firstOrCreate(
                ['job_order_id' => $jo->id],
                [
                    'invoice_number' => 'INV-' . strtoupper(Str::random(8)),
                    'total_labor'    => 0,
                    'total_parts'    => $jo->actual_cost ?? 0,
                    'tax_amount'     => 0,
                    'discount_amount'=> $discount,
                    'grand_total'    => $jo->actual_cost ?? 0,
                    'status'         => 'unpaid',
                ]
            );

            $payment = Payment::create([
                'job_order_id'     => $jo->id,
                'invoice_id'       => $invoice ? $invoice->id : null,
                'amount'           => $validated['amount'],
                'discount'         => $discount,
                'payment_method'   => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'payment_date'     => Carbon::parse($validated['payment_date'])->toDateTimeString(),
            ]);

            // Update Job Order
            $jo->discount = (float)($jo->discount ?? 0) + $discount;
            $jo->amount_paid += $validated['amount'];
            
            $netTotal = max(0, (float)$jo->actual_cost - (float)$jo->discount);

            // Check status
            if ($jo->amount_paid >= $netTotal) {
                $jo->payment_status = 'paid';
                $jo->status = 'released'; // Release vehicle once paid
            } elseif ($jo->amount_paid > 0 || $jo->discount > 0) {
                $jo->payment_status = 'partial';
            }

            $jo->save();

            return response()->json([
                'message' => 'Payment processed successfully.',
                'data'    => $payment
            ], 201);
        });
    }

    /**
     * Get un-paid or partially paid Job Orders for the Cashier dashboard
     */
    public function unpaidJobOrders()
    {
        $jos = JobOrder::with('vehicle.customer', 'payments')
            ->whereIn('status', ['completed', 'released'])
            ->orderBy('updated_at', 'desc')
            ->get();
            
        return response()->json(['data' => $jos]);
    }

    /**
     * Daily income report logic
     */
    public function dailyIncome(Request $request)
    {
        $date = $request->date ? Carbon::parse($request->date) : Carbon::today();

        $payments = Payment::with('jobOrder.customer')
            ->whereDate('payment_date', $date->toDateString())
            ->get();

        $summary = $payments->groupBy('payment_method')->map(function ($group) {
            return $group->sum('amount');
        });

        $total = $payments->sum('amount');

        return response()->json([
            'data' => [
                'date' => $date->toDateString(),
                'total' => $total,
                'summary' => $summary,
                'payments' => $payments->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'job_order_number' => $p->jobOrder->job_order_number ?? 'N/A',
                        'customer' => $p->jobOrder->customer->full_name ?? 'Walk-in',
                        'amount' => $p->amount,
                        'payment_method' => $p->payment_method,
                        'reference_number' => $p->reference_number,
                        'time' => Carbon::parse($p->payment_date)->format('H:i A'),
                    ];
                })
            ]
        ]);
    }
}
