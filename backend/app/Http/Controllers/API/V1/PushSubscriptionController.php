<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PushSubscriptionController extends Controller
{
    /**
     * Get the VAPID public key.
     */
    public function getVapidKey()
    {
        return response()->json([
            'public_key' => env('VAPID_PUBLIC_KEY', 'BJG0xNGLJ1PuvRfZWjkJTflHZP5p7NW6VDmdz9cAWAIb43zrBX81OVl20XF10KLWzWGMtPeBz2cwUT805-1aKuw')
        ]);
    }

    /**
     * Store or update a push subscription for the authenticated user's device.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subscription'                 => 'required|array',
            'subscription.endpoint'        => 'required|string',
            'subscription.keys'            => 'required|array',
            'subscription.keys.p256dh'     => 'required|string',
            'subscription.keys.auth'       => 'required|string',
            'user_agent'                   => 'nullable|string',
            'device_name'                  => 'nullable|string',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $endpoint = $validated['subscription']['endpoint'];
        $publicKey = $validated['subscription']['keys']['p256dh'];
        $authToken = $validated['subscription']['keys']['auth'];

        $sub = PushSubscription::updateOrCreate(
            ['endpoint' => $endpoint],
            [
                'user_id'          => $user->id,
                'public_key'       => $publicKey,
                'auth_token'       => $authToken,
                'content_encoding' => 'aes128gcm',
                'user_agent'       => $validated['user_agent'] ?? $request->header('User-Agent'),
                'device_name'      => $validated['device_name'] ?? null,
                'last_used_at'     => now(),
            ]
        );

        Log::info("Push subscription registered for User #{$user->id} (Device: {$sub->device_name})");

        return response()->json([
            'message' => 'Push subscription registered successfully',
            'status'  => 'active'
        ], 201);
    }

    /**
     * Check if the current device/endpoint is subscribed.
     */
    public function status(Request $request)
    {
        $endpoint = $request->query('endpoint');
        $user = $request->user();

        if (!$endpoint) {
            $count = PushSubscription::where('user_id', $user->id)->count();
            return response()->json([
                'subscribed' => $count > 0,
                'device_count' => $count
            ]);
        }

        $exists = PushSubscription::where('user_id', $user->id)
            ->where('endpoint', $endpoint)
            ->exists();

        return response()->json([
            'subscribed' => $exists
        ]);
    }

    /**
     * Remove a push subscription.
     */
    public function destroy(Request $request)
    {
        $endpoint = $request->input('endpoint') ?? $request->query('endpoint');

        if ($endpoint) {
            PushSubscription::where('endpoint', $endpoint)
                ->where('user_id', $request->user()->id)
                ->delete();

            Log::info("Push subscription removed for User #{$request->user()->id}");
        }

        return response()->json([
            'message' => 'Push subscription removed successfully'
        ]);
    }

    /**
     * Send a safe test notification to the current user.
     */
    public function testNotification(Request $request, PushNotificationService $pushService)
    {
        $user = $request->user();

        $result = $pushService->sendToUser(
            $user->id,
            'Carshop System',
            'Carshop Web Push is working.',
            '/',
            'system'
        );

        return response()->json([
            'message' => 'Test notification dispatched',
            'details' => $result
        ]);
    }
}
