<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PushSubscriptionController extends Controller
{
    /**
     * Store a push subscription for the authenticated user/device.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subscription'          => 'required|array',
            'subscription.endpoint' => 'required|string',
            'user_agent'            => 'nullable|string',
        ]);

        $user = $request->user();

        // Subscriptions can be saved to database or logged until VAPID keys are configured
        Log::info('Push subscription registered', [
            'user_id'    => $user?->id,
            'endpoint'   => $validated['subscription']['endpoint'],
            'user_agent' => $validated['user_agent'] ?? null,
        ]);

        return response()->json([
            'message' => 'Push subscription registered successfully',
            'status'  => 'active'
        ], 201);
    }

    /**
     * Remove a push subscription.
     */
    public function destroy(Request $request)
    {
        $endpoint = $request->input('endpoint');

        Log::info('Push subscription removed', [
            'user_id'  => $request->user()?->id,
            'endpoint' => $endpoint,
        ]);

        return response()->json([
            'message' => 'Push subscription removed successfully'
        ]);
    }
}
