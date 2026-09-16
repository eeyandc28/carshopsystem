-- ==============================================================================
-- Schema for Roles, Permissions, User Roles, and Audit Logs (Car Shop ERP RBAC)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yqigmkwdkwjmsvtcztai/sql/new
-- ==============================================================================

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    module VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id BIGINT REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (role_id, permission_id)
);

-- 4. Create user_roles junction table for multi-role support
CREATE TABLE IF NOT EXISTS public.user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, role_id)
);

-- 5. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    user_name VARCHAR(150),
    user_email VARCHAR(150),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    description TEXT,
    ip_address VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enhance users table with additional fields if missing
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL;

-- 7. Enable RLS and create open policies for authenticated/app usage
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to roles" ON public.roles;
CREATE POLICY "Allow all access to roles" ON public.roles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to permissions" ON public.permissions;
CREATE POLICY "Allow all access to permissions" ON public.permissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to role_permissions" ON public.role_permissions;
CREATE POLICY "Allow all access to role_permissions" ON public.role_permissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to user_roles" ON public.user_roles;
CREATE POLICY "Allow all access to user_roles" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to audit_logs" ON public.audit_logs;
CREATE POLICY "Allow all access to audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 8. Seed Standard Permissions
-- ==============================================================================
INSERT INTO public.permissions (name, slug, module, description) VALUES
-- Dashboard
('View Dashboard', 'dashboard.view', 'dashboard', 'Access main metrics and overview dashboard'),

-- Users
('View Users', 'users.view', 'users', 'View list of all system users'),
('Create User', 'users.create', 'users', 'Create and register new system user accounts'),
('Edit User', 'users.edit', 'users', 'Update user profiles, details, and roles'),
('Delete User', 'users.delete', 'users', 'Delete system user accounts'),
('Activate/Deactivate User', 'users.status', 'users', 'Enable or disable user access to the system'),
('Reset Password', 'users.reset_password', 'users', 'Reset or change user passwords'),

-- Roles & Permissions
('View Roles', 'roles.view', 'roles', 'View list of system roles and assigned permissions'),
('Create Role', 'roles.create', 'roles', 'Create custom roles'),
('Edit Role', 'roles.edit', 'roles', 'Edit role information and metadata'),
('Delete Role', 'roles.delete', 'roles', 'Delete non-system custom roles'),
('Assign Permissions', 'roles.assign_permissions', 'roles', 'Assign or revoke module permissions for roles'),

-- Customers
('View Customers', 'customers.view', 'customers', 'View customer list and details'),
('Create Customer', 'customers.create', 'customers', 'Add new customer records'),
('Edit Customer', 'customers.edit', 'customers', 'Update existing customer records'),
('Delete Customer', 'customers.delete', 'customers', 'Remove customer records'),
('View Customer History', 'customers.history', 'customers', 'Access customer transaction and vehicle history'),

-- Vehicles
('View Vehicles', 'vehicles.view', 'vehicles', 'View list of vehicles and profiles'),
('Register Vehicle', 'vehicles.create', 'vehicles', 'Add new vehicle records'),
('Edit Vehicle', 'vehicles.edit', 'vehicles', 'Update vehicle specifications and owner info'),
('Delete Vehicle', 'vehicles.delete', 'vehicles', 'Remove vehicle records'),
('View Vehicle Service History', 'vehicles.service_history', 'vehicles', 'Access comprehensive vehicle service logs'),
('View Vehicle Repair History', 'vehicles.repair_history', 'vehicles', 'Access past repair records and diagnostic notes'),
('View Replaced Parts History', 'vehicles.parts_history', 'vehicles', 'View all replacement parts installed on vehicle'),

-- Appointments
('View Appointments', 'appointments.view', 'appointments', 'View service appointment calendar and list'),
('Create Appointment', 'appointments.create', 'appointments', 'Book new service appointments'),
('Edit Appointment', 'appointments.edit', 'appointments', 'Reschedule and update appointment details'),
('Cancel Appointment', 'appointments.cancel', 'appointments', 'Cancel booked appointments'),
('Update Appointment Status', 'appointments.update_status', 'appointments', 'Change appointment progress status'),

-- Job Orders / Repair Orders
('View Job Orders', 'job_orders.view', 'job_orders', 'View job orders and status board'),
('Create Job Order', 'job_orders.create', 'job_orders', 'Create new job orders and repair estimates'),
('Edit Job Order', 'job_orders.edit', 'job_orders', 'Update job order specifications and details'),
('Delete Job Order', 'job_orders.delete', 'job_orders', 'Delete job orders'),
('Assign Mechanic', 'job_orders.assign_mechanic', 'job_orders', 'Assign technicians to specific job orders'),
('Update Job Order Status', 'job_orders.update_status', 'job_orders', 'Advance job order workflow stages'),
('Add Labor Performed', 'job_orders.add_labor', 'job_orders', 'Record mechanic labor and service fees'),
('Add Parts Used', 'job_orders.add_parts', 'job_orders', 'Allocate inventory parts to job orders'),
('Upload Attachments', 'job_orders.upload_attachments', 'job_orders', 'Attach diagnostic photos and inspection files'),
('Close Job Order', 'job_orders.close', 'job_orders', 'Finalize and complete job orders'),

-- Quotations
('View Quotations', 'quotations.view', 'quotations', 'View quotations and estimates'),
('Create Quotation', 'quotations.create', 'quotations', 'Prepare price quotes for customers'),
('Edit Quotation', 'quotations.edit', 'quotations', 'Update items and pricing in quotations'),
('Approve Quotation', 'quotations.approve', 'quotations', 'Mark customer approval on quotes'),
('Reject Quotation', 'quotations.reject', 'quotations', 'Mark quote as declined'),
('Print Quotation', 'quotations.print', 'quotations', 'Generate printable quotation PDF'),
('Convert Quotation to Job Order', 'quotations.convert_job_order', 'quotations', 'Transform approved quote into active job order'),

-- Parts / Inventory
('View Inventory', 'inventory.view', 'inventory', 'View inventory catalog and stock levels'),
('Add Part', 'inventory.create', 'inventory', 'Add new part or product to inventory'),
('Edit Part', 'inventory.edit', 'inventory', 'Update part details and pricing'),
('Delete Part', 'inventory.delete', 'inventory', 'Remove inventory items'),
('Stock In (Deliveries)', 'inventory.stock_in', 'inventory', 'Record incoming deliveries and receive stock'),
('Stock Out', 'inventory.stock_out', 'inventory', 'Dispatch or consume inventory items'),
('Adjust Inventory', 'inventory.adjust', 'inventory', 'Perform physical count stock adjustments'),
('Transfer Parts', 'inventory.transfer', 'inventory', 'Transfer stock between storage locations'),
('View Low Stock Items', 'inventory.low_stock', 'inventory', 'Access reorder alerts and low stock monitor'),
('View Inventory History', 'inventory.history', 'inventory', 'Access Stock Card and item movement reports'),

-- Suppliers
('View Suppliers', 'suppliers.view', 'suppliers', 'View list of suppliers and contact information'),
('Create Supplier', 'suppliers.create', 'suppliers', 'Register new auto parts vendors'),
('Edit Supplier', 'suppliers.edit', 'suppliers', 'Update supplier profile and terms'),
('Delete Supplier', 'suppliers.delete', 'suppliers', 'Remove supplier records'),
('View Supplier Transactions', 'suppliers.transactions', 'suppliers', 'View purchase history with supplier'),

-- Invoices
('View Invoices', 'invoices.view', 'invoices', 'View customer billing and invoices'),
('Create Invoice', 'invoices.create', 'invoices', 'Generate invoice from job order or sales'),
('Edit Invoice', 'invoices.edit', 'invoices', 'Update invoice terms and line items'),
('Void Invoice', 'invoices.void', 'invoices', 'Cancel or void issued invoices'),
('Print Invoice', 'invoices.print', 'invoices', 'Print invoice receipts and statements'),

-- Payments
('View Payments', 'payments.view', 'payments', 'Access payment history and cashier register'),
('Record Payment', 'payments.create', 'payments', 'Process customer payments and discounts'),
('Edit Payment', 'payments.edit', 'payments', 'Update payment records'),
('Void Payment', 'payments.void', 'payments', 'Void recorded payment transactions'),
('Print Receipt', 'payments.print', 'payments', 'Generate and print official payment receipts'),

-- Expenses
('View Expenses', 'expenses.view', 'expenses', 'View operational expenses and bills'),
('Create Expense', 'expenses.create', 'expenses', 'Record business expense disbursements'),
('Edit Expense', 'expenses.edit', 'expenses', 'Update expense details'),
('Delete Expense', 'expenses.delete', 'expenses', 'Remove expense entries'),
('Approve Expense', 'expenses.approve', 'expenses', 'Authorize requested business expenses'),

-- Reports
('View Sales Reports', 'reports.sales', 'reports', 'Generate and analyze revenue and sales summaries'),
('View Service Reports', 'reports.service', 'reports', 'Analyze service department throughput'),
('View Customer Reports', 'reports.customer', 'reports', 'Review customer retention and frequency reports'),
('View Vehicle Reports', 'reports.vehicle', 'reports', 'Analyze vehicle service volume and makes'),
('View Inventory Reports', 'reports.inventory', 'reports', 'Generate valuation and stock-level reports'),
('View Parts Usage Reports', 'reports.parts_usage', 'reports', 'Track parts consumption across job orders'),
('View Mechanic Performance Reports', 'reports.mechanic_performance', 'reports', 'Monitor technician labor hours and efficiency'),
('View Financial Reports', 'reports.financial', 'reports', 'View income, daily cash intake, and P&L summaries'),
('Export Reports', 'reports.export', 'reports', 'Export report datasets to CSV/Excel/PDF'),
('Print Reports', 'reports.print', 'reports', 'Send formatted report summaries to printer'),

-- System Settings
('View Settings', 'settings.view', 'settings', 'View system configuration settings'),
('Edit Settings', 'settings.edit', 'settings', 'Update system preferences'),
('Manage Business Information', 'settings.business_info', 'settings', 'Update company profile, logo, and address'),
('Manage Service Categories', 'settings.service_categories', 'settings', 'Configure service types and packages'),
('Manage Labor Rates', 'settings.labor_rates', 'settings', 'Configure hourly labor charges'),
('Manage Vehicle Types', 'settings.vehicle_types', 'settings', 'Manage vehicle classifications and makes'),
('Manage Payment Methods', 'settings.payment_methods', 'settings', 'Configure accepted payment gateways'),

-- Audit Logs
('View Audit Logs', 'audit_logs.view', 'audit_logs', 'Review system audit trail and user activity'),
('Export Audit Logs', 'audit_logs.export', 'audit_logs', 'Export security audit records')
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    description = EXCLUDED.description;

-- ==============================================================================
-- 9. Seed Default Roles
-- ==============================================================================
INSERT INTO public.roles (name, slug, description, is_system, status) VALUES
('Super Administrator', 'super_admin', 'Full access to all system modules, settings, users, roles, and audit logs', true, 'active'),
('General Manager / Owner', 'general_manager', 'Access to executive dashboards, financial reports, customers, inventory, and operations', true, 'active'),
('Service Advisor', 'service_advisor', 'Front-office management of customers, vehicles, appointments, quotations, and job orders', true, 'active'),
('Mechanic / Technician', 'mechanic', 'Shop floor access to assigned job orders, labor recording, and parts usage', true, 'active'),
('Parts / Inventory Staff', 'inventory_staff', 'Management of parts inventory, deliveries, suppliers, and stock cards', true, 'active'),
('Cashier', 'cashier', 'Management of invoices, cashier register, payment processing, receipts, and daily income', true, 'active'),
('Sales Staff', 'sales_staff', 'Management of customer relations, vehicle registration, and quotations', true, 'active'),
('Accountant', 'accountant', 'Access to financial reports, income, invoices, payments, and expenses', true, 'active'),
('Receptionist', 'receptionist', 'Front desk registration of customers, vehicles, and appointments', true, 'active')
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_system = EXCLUDED.is_system;

-- Also ensure 'admin' alias exists if legacy code uses 'admin'
INSERT INTO public.roles (name, slug, description, is_system, status) VALUES
('Administrator', 'admin', 'Full administrative system control', true, 'active')
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- 10. Assign Permissions to Default Roles
-- ==============================================================================

-- 10.1 Super Administrator & Admin: Assign ALL permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug IN ('super_admin', 'admin')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 10.2 General Manager / Owner
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.slug = 'general_manager' AND p.slug IN (
    'dashboard.view',
    'users.view',
    'roles.view',
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
    'settings.view',
    'audit_logs.view', 'audit_logs.export'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 10.3 Service Advisor
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.slug = 'service_advisor' AND p.slug IN (
    'dashboard.view',
    'customers.view', 'customers.create', 'customers.edit', 'customers.history',
    'vehicles.view', 'vehicles.create', 'vehicles.edit', 'vehicles.service_history', 'vehicles.repair_history', 'vehicles.parts_history',
    'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.update_status',
    'job_orders.view', 'job_orders.create', 'job_orders.edit', 'job_orders.assign_mechanic', 'job_orders.update_status', 'job_orders.add_labor', 'job_orders.add_parts', 'job_orders.upload_attachments',
    'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.approve', 'quotations.reject', 'quotations.print', 'quotations.convert_job_order',
    'inventory.view', 'inventory.low_stock',
    'suppliers.view',
    'invoices.view', 'invoices.create', 'invoices.print'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 10.4 Mechanic / Technician
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.slug = 'mechanic' AND p.slug IN (
    'dashboard.view',
    'job_orders.view', 'job_orders.update_status', 'job_orders.add_labor', 'job_orders.add_parts', 'job_orders.upload_attachments',
    'vehicles.view', 'vehicles.service_history', 'vehicles.repair_history', 'vehicles.parts_history',
    'inventory.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 10.5 Parts / Inventory Staff
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.slug = 'inventory_staff' AND p.slug IN (
    'dashboard.view',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.stock_in', 'inventory.stock_out', 'inventory.adjust', 'inventory.transfer', 'inventory.low_stock', 'inventory.history',
    'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.transactions',
    'reports.inventory', 'reports.parts_usage', 'reports.export'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 10.6 Cashier
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.slug = 'cashier' AND p.slug IN (
    'dashboard.view',
    'invoices.view', 'invoices.create', 'invoices.print',
    'payments.view', 'payments.create', 'payments.print', 'payments.void',
    'reports.financial', 'reports.sales'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 10.7 Sales Staff
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.slug = 'sales_staff' AND p.slug IN (
    'dashboard.view',
    'customers.view', 'customers.create', 'customers.edit', 'customers.history',
    'vehicles.view', 'vehicles.create', 'vehicles.edit',
    'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.print', 'quotations.convert_job_order',
    'reports.sales'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 10.8 Accountant
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.slug = 'accountant' AND p.slug IN (
    'dashboard.view',
    'invoices.view', 'invoices.print',
    'payments.view', 'payments.print',
    'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
    'reports.sales', 'reports.financial', 'reports.export', 'reports.print'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 10.9 Receptionist
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.slug = 'receptionist' AND p.slug IN (
    'dashboard.view',
    'customers.view', 'customers.create', 'customers.edit',
    'vehicles.view', 'vehicles.create', 'vehicles.edit',
    'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.update_status',
    'job_orders.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================================================
-- 11. Populate user_roles for all existing users in the system
-- ==============================================================================
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
JOIN public.roles r ON (
    r.slug = u.role 
    OR (u.role = 'admin' AND r.slug = 'super_admin')
)
ON CONFLICT (user_id, role_id) DO NOTHING;
