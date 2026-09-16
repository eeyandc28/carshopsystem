<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;
use App\Models\AuditLog;

class AuthController extends Controller
{
    private function formatUserData(User $user): array
    {
        $user->load('roles.permissions');

        $perms = [];
        $roles = $user->roles;

        if ($user->role === 'super_admin' || $user->role === 'admin' || $roles->contains('slug', 'super_admin') || $roles->contains('slug', 'admin')) {
            $perms = ['*'];
        } else {
            foreach ($roles as $r) {
                foreach ($r->permissions as $p) {
                    $perms[] = $p->slug;
                }
            }

            // Fallback: If roles is empty or missing permissions, fetch from Role model by slug
            if ($user->role) {
                $roleModel = Role::with('permissions')->where('slug', $user->role)->first();
                if ($roleModel) {
                    if ($roles->isEmpty()) {
                        $roles = collect([$roleModel]);
                    }
                    foreach ($roleModel->permissions as $p) {
                        $perms[] = $p->slug;
                    }
                }
            }

            // Built-in fallback defaults for standard roles if database permissions are unlinked
            if (empty($perms) && $user->role === 'cashier') {
                $perms = [
                    'dashboard.view',
                    'invoices.view',
                    'invoices.create',
                    'invoices.print',
                    'payments.view',
                    'payments.create',
                    'payments.print',
                    'payments.void',
                    'reports.financial',
                    'reports.sales'
                ];
            }

            $perms = array_values(array_unique($perms));
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'contact_number' => $user->contact_number,
            'avatar' => $user->avatar,
            'role' => $user->role,
            'status' => $user->status ?? 'active',
            'roles' => $roles,
            'role_names' => $roles->pluck('name')->toArray(),
            'permissions' => $perms,
            'last_login_at' => $user->last_login_at,
            'created_at' => $user->created_at,
        ];
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', strtolower(trim($request->email)))->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        if (($user->status ?? 'active') === 'inactive') {
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact the system administrator.'
            ], 403);
        }

        // Update last login
        $user->update(['last_login_at' => now()]);

        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'action' => 'login',
            'module' => 'auth',
            'record_id' => $user->id,
            'description' => "User \"{$user->name}\" logged into the system",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->formatUserData($user)
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            AuditLog::create([
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->name,
                'user_email' => $request->user()->email,
                'action' => 'logout',
                'module' => 'auth',
                'record_id' => $request->user()->id,
                'description' => "User \"{$request->user()->name}\" logged out",
                'ip_address' => $request->ip(),
                'created_at' => now(),
            ]);

            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($this->formatUserData($request->user()));
    }
}
