<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationService
{
    protected ?WebPush $webPush = null;

    public function __construct()
    {
        $publicKey = env('VAPID_PUBLIC_KEY');
        $privateKey = env('VAPID_PRIVATE_KEY');
        $subject = env('VAPID_SUBJECT', 'mailto:support@carshopsystem.com');

        if ($publicKey && $privateKey) {
            $this->webPush = new WebPush([
                'VAPID' => [
                    'subject'    => $subject,
                    'publicKey'  => $publicKey,
                    'privateKey' => $privateKey,
                ]
            ]);
            $this->webPush->setReuseVAPIDHeaders(true);
        }
    }

    /**
     * Send a notification to a specific user across all registered devices.
     */
    public function sendToUser($userId, string $title, string $message, string $url = '/', string $type = 'general', $relatedId = null): array
    {
        // 1. Save in-app notification history record
        $notification = Notification::create([
            'user_id'      => $userId,
            'type'         => $type,
            'title'        => $title,
            'message'      => $message,
            'url'          => $url,
            'related_id'   => $relatedId,
        ]);

        if (!$this->webPush) {
            Log::info("WebPush not configured with VAPID keys. In-app notification created for user #{$userId}");
            return ['status' => 'saved_in_app_only', 'notification' => $notification];
        }

        // 2. Fetch all registered push subscriptions for this user
        $subscriptions = PushSubscription::where('user_id', $userId)->get();
        if ($subscriptions->isEmpty()) {
            return ['status' => 'no_device_subscriptions', 'notification' => $notification];
        }

        $payload = json_encode([
            'title'     => $title,
            'body'      => $message,
            'url'       => $url,
            'type'      => $type,
            'record_id' => $relatedId,
            'icon'      => '/icons/icon-192x192.png',
            'badge'     => '/icons/icon-72x72.png',
        ]);

        $invalidEndpoints = [];

        foreach ($subscriptions as $sub) {
            try {
                $webPushSub = Subscription::create([
                    'endpoint'        => $sub->endpoint,
                    'publicKey'       => $sub->public_key,
                    'authToken'       => $sub->auth_token,
                    'contentEncoding' => $sub->content_encoding ?: 'aes128gcm',
                ]);

                $this->webPush->queueNotification($webPushSub, $payload);
            } catch (\Exception $e) {
                Log::warning("Error preparing push subscription #{$sub->id}: " . $e->getMessage());
            }
        }

        $sentCount = 0;
        $failedCount = 0;

        foreach ($this->webPush->flush() as $report) {
            $endpoint = $report->getRequest()->getUri()->__toString();

            if ($report->isSuccess()) {
                $sentCount++;
                PushSubscription::where('endpoint', $endpoint)->update(['last_used_at' => now()]);
            } else {
                $failedCount++;
                Log::warning("Push delivery failed for endpoint: {$report->getReason()}");

                // If expired or gone (404/410), delete subscription
                if ($report->isSubscriptionExpired()) {
                    $invalidEndpoints[] = $endpoint;
                }
            }
        }

        // Clean up invalid subscriptions
        if (!empty($invalidEndpoints)) {
            PushSubscription::whereIn('endpoint', $invalidEndpoints)->delete();
            Log::info("Removed " . count($invalidEndpoints) . " expired push subscriptions for user #{$userId}");
        }

        return [
            'status'        => 'sent',
            'sent'          => $sentCount,
            'failed'        => $failedCount,
            'notification'  => $notification
        ];
    }

    /**
     * Send notification to multiple users.
     */
    public function sendToUsers(array $userIds, string $title, string $message, string $url = '/', string $type = 'general', $relatedId = null): array
    {
        $results = [];
        foreach (array_unique($userIds) as $uid) {
            $results[$uid] = $this->sendToUser($uid, $title, $message, $url, $type, $relatedId);
        }
        return $results;
    }

    /**
     * Send notification to all users holding any of the specified roles.
     */
    public function sendToRoles(array $roles, string $title, string $message, string $url = '/', string $type = 'general', $relatedId = null): array
    {
        $roleSlugs = array_map('strtolower', $roles);
        
        $users = User::whereHas('roles', function ($q) use ($roleSlugs) {
            $q->whereIn('slug', $roleSlugs)->orWhereIn('name', $roleSlugs);
        })->orWhere(function ($q) use ($roleSlugs) {
            foreach ($roleSlugs as $slug) {
                $q->orWhere('role', 'like', "%{$slug}%");
            }
        })->pluck('id')->toArray();

        return $this->sendToUsers($users, $title, $message, $url, $type, $relatedId);
    }
}
