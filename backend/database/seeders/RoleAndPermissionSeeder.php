<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Dashboard
            ['name' => 'View Dashboard', 'slug' => 'dashboard.view', 'module' => 'dashboard', 'description' => 'Access main metrics and overview dashboard'],

            // Users
            ['name' => 'View Users', 'slug' => 'users.view', 'module' => 'users', 'description' => 'View list of all system users'],
            ['name' => 'Create User', 'slug' => 'users.create', 'module' => 'users', 'description' => 'Create and register new system user accounts'],
            ['name' => 'Edit User', 'slug' => 'users.edit', 'module' => 'users', 'description' => 'Update user profiles, details, and roles'],
            ['name' => 'Delete User', 'slug' => 'users.delete', 'module' => 'users', 'description' => 'Delete system user accounts'],
            ['name' => 'Activate/Deactivate User', 'slug' => 'users.status', 'module' => 'users', 'description' => 'Enable or disable user access to the system'],
            ['name' => 'Reset Password', 'slug' => 'users.reset_password', 'module' => 'users', 'description' => 'Reset or change user passwords'],

            // Roles & Permissions
            ['name' => 'View Roles', 'slug' => 'roles.view', 'module' => 'roles', 'description' => 'View list of system roles and assigned permissions'],
            ['name' => 'Create Role', 'slug' => 'roles.create', 'module' => 'roles', 'description' => 'Create custom roles'],
            ['name' => 'Edit Role', 'slug' => 'roles.edit', 'module' => 'roles', 'description' => 'Edit role information and metadata'],
            ['name' => 'Delete Role', 'slug' => 'roles.delete', 'module' => 'roles', 'description' => 'Delete non-system custom roles'],
            ['name' => 'Assign Permissions', 'slug' => 'roles.assign_permissions', 'module' => 'roles', 'description' => 'Assign or revoke module permissions for roles'],

            // Customers
            ['name' => 'View Customers', 'slug' => 'customers.view', 'module' => 'customers', 'description' => 'View customer list and details'],
            ['name' => 'Create Customer', 'slug' => 'customers.create', 'module' => 'customers', 'description' => 'Add new customer records'],
            ['name' => 'Edit Customer', 'slug' => 'customers.edit', 'module' => 'customers', 'description' => 'Update existing customer records'],
            ['name' => 'Delete Customer', 'slug' => 'customers.delete', 'module' => 'customers', 'description' => 'Remove customer records'],
            ['name' => 'View Customer History', 'slug' => 'customers.history', 'module' => 'customers', 'description' => 'Access customer transaction and vehicle history'],

            // Vehicles
            ['name' => 'View Vehicles', 'slug' => 'vehicles.view', 'module' => 'vehicles', 'description' => 'View list of vehicles and profiles'],
            ['name' => 'Register Vehicle', 'slug' => 'vehicles.create', 'module' => 'vehicles', 'description' => 'Add new vehicle records'],
            ['name' => 'Edit Vehicle', 'slug' => 'vehicles.edit', 'module' => 'vehicles', 'description' => 'Update vehicle specifications and owner info'],
            ['name' => 'Delete Vehicle', 'slug' => 'vehicles.delete', 'module' => 'vehicles', 'description' => 'Remove vehicle records'],
            ['name' => 'View Vehicle Service History', 'slug' => 'vehicles.service_history', 'module' => 'vehicles', 'description' => 'Access comprehensive vehicle service logs'],
            ['name' => 'View Vehicle Repair History', 'slug' => 'vehicles.repair_history', 'module' => 'vehicles', 'description' => 'Access past repair records and diagnostic notes'],
            ['name' => 'View Replaced Parts History', 'slug' => 'vehicles.parts_history', 'module' => 'vehicles', 'description' => 'View all replacement parts installed on vehicle'],

            // Appointments
            ['name' => 'View Appointments', 'slug' => 'appointments.view', 'module' => 'appointments', 'description' => 'View service appointment calendar and list'],
            ['name' => 'Create Appointment', 'slug' => 'appointments.create', 'module' => 'appointments', 'description' => 'Book new service appointments'],
            ['name' => 'Edit Appointment', 'slug' => 'appointments.edit', 'module' => 'appointments', 'description' => 'Reschedule and update appointment details'],
            ['name' => 'Cancel Appointment', 'slug' => 'appointments.cancel', 'module' => 'appointments', 'description' => 'Cancel booked appointments'],
            ['name' => 'Update Appointment Status', 'slug' => 'appointments.update_status', 'module' => 'appointments', 'description' => 'Change appointment progress status'],

            // Job Orders / Repair Orders
            ['name' => 'View Job Orders', 'slug' => 'job_orders.view', 'module' => 'job_orders', 'description' => 'View job orders and status board'],
            ['name' => 'Create Job Order', 'slug' => 'job_orders.create', 'module' => 'job_orders', 'description' => 'Create new job orders and repair estimates'],
            ['name' => 'Edit Job Order', 'slug' => 'job_orders.edit', 'module' => 'job_orders', 'description' => 'Update job order specifications and details'],
            ['name' => 'Delete Job Order', 'slug' => 'job_orders.delete', 'module' => 'job_orders', 'description' => 'Delete job orders'],
            ['name' => 'Assign Mechanic', 'slug' => 'job_orders.assign_mechanic', 'module' => 'job_orders', 'description' => 'Assign technicians to specific job orders'],
            ['name' => 'Update Job Order Status', 'slug' => 'job_orders.update_status', 'module' => 'job_orders', 'description' => 'Advance job order workflow stages'],
            ['name' => 'Add Labor Performed', 'slug' => 'job_orders.add_labor', 'module' => 'job_orders', 'description' => 'Record mechanic labor and service fees'],
            ['name' => 'Add Parts Used', 'slug' => 'job_orders.add_parts', 'module' => 'job_orders', 'description' => 'Allocate inventory parts to job orders'],
            ['name' => 'Upload Attachments', 'slug' => 'job_orders.upload_attachments', 'module' => 'job_orders', 'description' => 'Attach diagnostic photos and inspection files'],
            ['name' => 'Close Job Order', 'slug' => 'job_orders.close', 'module' => 'job_orders', 'description' => 'Finalize and complete job orders'],

            // Quotations
            ['name' => 'View Quotations', 'slug' => 'quotations.view', 'module' => 'quotations', 'description' => 'View quotations and estimates'],
            ['name' => 'Create Quotation', 'slug' => 'quotations.create', 'module' => 'quotations', 'description' => 'Prepare price quotes for customers'],
            ['name' => 'Edit Quotation', 'slug' => 'quotations.edit', 'module' => 'quotations', 'description' => 'Update items and pricing in quotations'],
            ['name' => 'Approve Quotation', 'slug' => 'quotations.approve', 'module' => 'quotations', 'description' => 'Mark customer approval on quotes'],
            ['name' => 'Reject Quotation', 'slug' => 'quotations.reject', 'module' => 'quotations', 'description' => 'Mark quote as declined'],
            ['name' => 'Print Quotation', 'slug' => 'quotations.print', 'module' => 'quotations', 'description' => 'Generate printable quotation PDF'],
            ['name' => 'Convert Quotation to Job Order', 'slug' => 'quotations.convert_job_order', 'module' => 'quotations', 'description' => 'Transform approved quote into active job order'],

            // Parts / Inventory
            ['name' => 'View Inventory', 'slug' => 'inventory.view', 'module' => 'inventory', 'description' => 'View inventory catalog and stock levels'],
            ['name' => 'Add Part', 'slug' => 'inventory.create', 'module' => 'inventory', 'description' => 'Add new part or product to inventory'],
            ['name' => 'Edit Part', 'slug' => 'inventory.edit', 'module' => 'inventory', 'description' => 'Update part details and pricing'],
            ['name' => 'Delete Part', 'slug' => 'inventory.delete', 'module' => 'inventory', 'description' => 'Remove inventory items'],
            ['name' => 'Stock In (Deliveries)', 'slug' => 'inventory.stock_in', 'module' => 'inventory', 'description' => 'Record incoming deliveries and receive stock'],
            ['name' => 'Stock Out', 'slug' => 'inventory.stock_out', 'module' => 'inventory', 'description' => 'Dispatch or consume inventory items'],
            ['name' => 'Adjust Inventory', 'slug' => 'inventory.adjust', 'module' => 'inventory', 'description' => 'Perform physical count stock adjustments'],
            ['name' => 'Transfer Parts', 'slug' => 'inventory.transfer', 'module' => 'inventory', 'description' => 'Transfer stock between storage locations'],
            ['name' => 'View Low Stock Items', 'slug' => 'inventory.low_stock', 'module' => 'inventory', 'description' => 'Access reorder alerts and low stock monitor'],
            ['name' => 'View Inventory History', 'slug' => 'inventory.history', 'module' => 'inventory', 'description' => 'Access Stock Card and item movement reports'],

            // Suppliers
            ['name' => 'View Suppliers', 'slug' => 'suppliers.view', 'module' => 'suppliers', 'description' => 'View list of suppliers and contact information'],
            ['name' => 'Create Supplier', 'slug' => 'suppliers.create', 'module' => 'suppliers', 'description' => 'Register new auto parts vendors'],
            ['name' => 'Edit Supplier', 'slug' => 'suppliers.edit', 'module' => 'suppliers', 'description' => 'Update supplier profile and terms'],
            ['name' => 'Delete Supplier', 'slug' => 'suppliers.delete', 'module' => 'suppliers', 'description' => 'Remove supplier records'],
            ['name' => 'View Supplier Transactions', 'slug' => 'suppliers.transactions', 'module' => 'suppliers', 'description' => 'View purchase history with supplier'],

            // Invoices
            ['name' => 'View Invoices', 'slug' => 'invoices.view', 'module' => 'invoices', 'description' => 'View customer billing and invoices'],
            ['name' => 'Create Invoice', 'slug' => 'invoices.create', 'module' => 'invoices', 'description' => 'Generate invoice from job order or sales'],
            ['name' => 'Edit Invoice', 'slug' => 'invoices.edit', 'module' => 'invoices', 'description' => 'Update invoice terms and line items'],
            ['name' => 'Void Invoice', 'slug' => 'invoices.void', 'module' => 'invoices', 'description' => 'Cancel or void issued invoices'],
            ['name' => 'Print Invoice', 'slug' => 'invoices.print', 'module' => 'invoices', 'description' => 'Print invoice receipts and statements'],

            // Payments
            ['name' => 'View Payments', 'slug' => 'payments.view', 'module' => 'payments', 'description' => 'Access payment history and cashier register'],
            ['name' => 'Record Payment', 'slug' => 'payments.create', 'module' => 'payments', 'description' => 'Process customer payments and discounts'],
            ['name' => 'Edit Payment', 'slug' => 'payments.edit', 'module' => 'payments', 'description' => 'Update payment records'],
            ['name' => 'Void Payment', 'slug' => 'payments.void', 'module' => 'payments', 'description' => 'Void recorded payment transactions'],
            ['name' => 'Print Receipt', 'slug' => 'payments.print', 'module' => 'payments', 'description' => 'Generate and print official payment receipts'],

            // Expenses
            ['name' => 'View Expenses', 'slug' => 'expenses.view', 'module' => 'expenses', 'description' => 'View operational expenses and bills'],
            ['name' => 'Create Expense', 'slug' => 'expenses.create', 'module' => 'expenses', 'description' => 'Record business expense disbursements'],
            ['name' => 'Edit Expense', 'slug' => 'expenses.edit', 'module' => 'expenses', 'description' => 'Update expense details'],
            ['name' => 'Delete Expense', 'slug' => 'expenses.delete', 'module' => 'expenses', 'description' => 'Remove expense entries'],
            ['name' => 'Approve Expense', 'slug' => 'expenses.approve', 'module' => 'expenses', 'description' => 'Authorize requested business expenses'],

            // Reports
            ['name' => 'View Sales Reports', 'slug' => 'reports.sales', 'module' => 'reports', 'description' => 'Generate and analyze revenue and sales summaries'],
            ['name' => 'View Service Reports', 'slug' => 'reports.service', 'module' => 'reports', 'description' => 'Analyze service department throughput'],
            ['name' => 'View Customer Reports', 'slug' => 'reports.customer', 'module' => 'reports', 'description' => 'Review customer retention and frequency reports'],
            ['name' => 'View Vehicle Reports', 'slug' => 'reports.vehicle', 'module' => 'reports', 'description' => 'Analyze vehicle service volume and makes'],
            ['name' => 'View Inventory Reports', 'slug' => 'reports.inventory', 'module' => 'reports', 'description' => 'Generate valuation and stock-level reports'],
            ['name' => 'View Parts Usage Reports', 'slug' => 'reports.parts_usage', 'module' => 'reports', 'description' => 'Track parts consumption across job orders'],
            ['name' => 'View Mechanic Performance Reports', 'slug' => 'reports.mechanic_performance', 'module' => 'reports', 'description' => 'Monitor technician labor hours and efficiency'],
            ['name' => 'View Financial Reports', 'slug' => 'reports.financial', 'module' => 'reports', 'description' => 'View income, daily cash intake, and P&L summaries'],
            ['name' => 'Export Reports', 'slug' => 'reports.export', 'module' => 'reports', 'description' => 'Export report datasets to CSV/Excel/PDF'],
            ['name' => 'Print Reports', 'slug' => 'reports.print', 'module' => 'reports', 'description' => 'Send formatted report summaries to printer'],

            // System Settings
            ['name' => 'View Settings', 'slug' => 'settings.view', 'module' => 'settings', 'description' => 'View system configuration settings'],
            ['name' => 'Edit Settings', 'slug' => 'settings.edit', 'module' => 'settings', 'description' => 'Update system preferences'],
            ['name' => 'Manage Business Information', 'slug' => 'settings.business_info', 'module' => 'settings', 'description' => 'Update company profile, logo, and address'],
            ['name' => 'Manage Service Categories', 'slug' => 'settings.service_categories', 'module' => 'settings', 'description' => 'Configure service types and packages'],
            ['name' => 'Manage Labor Rates', 'slug' => 'settings.labor_rates', 'module' => 'settings', 'description' => 'Configure hourly labor charges'],
            ['name' => 'Manage Vehicle Types', 'slug' => 'settings.vehicle_types', 'module' => 'settings', 'description' => 'Manage vehicle classifications and makes'],
            ['name' => 'Manage Payment Methods', 'slug' => 'settings.payment_methods', 'module' => 'settings', 'description' => 'Configure accepted payment gateways'],

            // Audit Logs
            ['name' => 'View Audit Logs', 'slug' => 'audit_logs.view', 'module' => 'audit_logs', 'description' => 'Review system audit trail and user activity'],
            ['name' => 'Export Audit Logs', 'slug' => 'audit_logs.export', 'module' => 'audit_logs', 'description' => 'Export security audit records'],
        ];

        foreach ($permissions as $p) {
            Permission::updateOrCreate(['slug' => $p['slug']], $p);
        }

        $roles = [
            [
                'name' => 'Super Administrator',
                'slug' => 'super_admin',
                'description' => 'Full access to all system modules, settings, users, roles, and audit logs',
                'is_system' => true,
                'status' => 'active',
                'permissions' => '*' // all
            ],
            [
                'name' => 'Administrator',
                'slug' => 'admin',
                'description' => 'Full administrative system control',
                'is_system' => true,
                'status' => 'active',
                'permissions' => '*' // all
            ],
            [
                'name' => 'General Manager / Owner',
                'slug' => 'general_manager',
                'description' => 'Access to executive dashboards, financial reports, customers, inventory, and operations',
                'is_system' => true,
                'status' => 'active',
                'permissions' => [
                    'dashboard.view', 'users.view', 'roles.view',
                    'customers.view', 'customers.create', 'customers.edit', 'customers.history',
                    'vehicles.view', 'vehicles.create', 'vehicles.edit', 'vehicles.service_history', 'vehicles.repair_history', 'vehicles.parts_history',
                    'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.update_status',
                    'job_orders.view', 'job_orders.create', 'job_orders.edit', 'job_orders.update_status', 'job_orders.close',
                    'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.approve', 'quotations.reject', 'quotations.print', 'quotations.convert_job_order',
                    'inventory.view', 'inventory.stock_in', 'inventory.low_stock', 'inventory.history',
                    'suppliers.view', 'suppliers.transactions',
                    'invoices.view', 'invoices.print',
                    'payments.view', 'payments.print',
                    'expenses.view', 'expenses.approve',
                    'reports.sales', 'reports.service', 'reports.customer', 'reports.vehicle', 'reports.inventory', 'reports.parts_usage', 'reports.mechanic_performance', 'reports.financial', 'reports.export', 'reports.print',
                    'settings.view', 'audit_logs.view', 'audit_logs.export'
                ]
            ],
            [
                'name' => 'Service Advisor',
                'slug' => 'service_advisor',
                'description' => 'Front-office management of customers, vehicles, appointments, quotations, and job orders',
                'is_system' => true,
                'status' => 'active',
                'permissions' => [
                    'dashboard.view',
                    'customers.view', 'customers.create', 'customers.edit', 'customers.history',
                    'vehicles.view', 'vehicles.create', 'vehicles.edit', 'vehicles.service_history', 'vehicles.repair_history', 'vehicles.parts_history',
                    'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.update_status',
                    'job_orders.view', 'job_orders.create', 'job_orders.edit', 'job_orders.assign_mechanic', 'job_orders.update_status', 'job_orders.add_labor', 'job_orders.add_parts', 'job_orders.upload_attachments',
                    'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.approve', 'quotations.reject', 'quotations.print', 'quotations.convert_job_order',
                    'inventory.view', 'inventory.low_stock',
                    'suppliers.view',
                    'invoices.view', 'invoices.create', 'invoices.print'
                ]
            ],
            [
                'name' => 'Mechanic / Technician',
                'slug' => 'mechanic',
                'description' => 'Shop floor access to assigned job orders, labor recording, and parts usage',
                'is_system' => true,
                'status' => 'active',
                'permissions' => [
                    'dashboard.view',
                    'job_orders.view', 'job_orders.update_status', 'job_orders.add_labor', 'job_orders.add_parts', 'job_orders.upload_attachments',
                    'vehicles.view', 'vehicles.service_history', 'vehicles.repair_history', 'vehicles.parts_history',
                    'inventory.view'
                ]
            ],
            [
                'name' => 'Parts / Inventory Staff',
                'slug' => 'inventory_staff',
                'description' => 'Management of parts inventory, deliveries, suppliers, and stock cards',
                'is_system' => true,
                'status' => 'active',
                'permissions' => [
                    'dashboard.view',
                    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.stock_in', 'inventory.stock_out', 'inventory.adjust', 'inventory.transfer', 'inventory.low_stock', 'inventory.history',
                    'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.transactions',
                    'reports.inventory', 'reports.parts_usage', 'reports.export'
                ]
            ],
            [
                'name' => 'Cashier',
                'slug' => 'cashier',
                'description' => 'Management of invoices, cashier register, payment processing, receipts, and daily income',
                'is_system' => true,
                'status' => 'active',
                'permissions' => [
                    'dashboard.view',
                    'invoices.view', 'invoices.create', 'invoices.print',
                    'payments.view', 'payments.create', 'payments.print', 'payments.void',
                    'reports.financial', 'reports.sales'
                ]
            ],
            [
                'name' => 'Sales Staff',
                'slug' => 'sales_staff',
                'description' => 'Management of customer relations, vehicle registration, and quotations',
                'is_system' => true,
                'status' => 'active',
                'permissions' => [
                    'dashboard.view',
                    'customers.view', 'customers.create', 'customers.edit', 'customers.history',
                    'vehicles.view', 'vehicles.create', 'vehicles.edit',
                    'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.print', 'quotations.convert_job_order',
                    'reports.sales'
                ]
            ],
            [
                'name' => 'Accountant',
                'slug' => 'accountant',
                'description' => 'Access to financial reports, income, invoices, payments, and expenses',
                'is_system' => true,
                'status' => 'active',
                'permissions' => [
                    'dashboard.view',
                    'invoices.view', 'invoices.print',
                    'payments.view', 'payments.print',
                    'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
                    'reports.sales', 'reports.financial', 'reports.export', 'reports.print'
                ]
            ],
            [
                'name' => 'Receptionist',
                'slug' => 'receptionist',
                'description' => 'Front desk registration of customers, vehicles, and appointments',
                'is_system' => true,
                'status' => 'active',
                'permissions' => [
                    'dashboard.view',
                    'customers.view', 'customers.create', 'customers.edit',
                    'vehicles.view', 'vehicles.create', 'vehicles.edit',
                    'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.update_status',
                    'job_orders.view'
                ]
            ]
        ];

        $allPermIds = Permission::pluck('id')->toArray();

        foreach ($roles as $rData) {
            $perms = $rData['permissions'];
            unset($rData['permissions']);

            $role = Role::updateOrCreate(['slug' => $rData['slug']], $rData);

            if ($perms === '*') {
                $role->permissions()->sync($allPermIds);
            } elseif (is_array($perms)) {
                $permIds = Permission::whereIn('slug', $perms)->pluck('id')->toArray();
                $role->permissions()->sync($permIds);
            }
        }

        // Attach roles to existing users
        foreach (User::all() as $u) {
            $roleSlug = $u->role === 'admin' ? 'super_admin' : $u->role;
            $r = Role::where('slug', $roleSlug)->first();
            if ($r) {
                $u->roles()->syncWithoutDetaching([$r->id]);
            }
        }
    }
}
