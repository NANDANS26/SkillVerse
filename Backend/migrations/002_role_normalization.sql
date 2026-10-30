-- Migration: 002_role_normalization.sql
-- Description: Safe normalization of legacy role values to canonical 6-role vocabulary
-- Security Rule: Do NOT blindly elevate arbitrary legacy 'admin' accounts to 'super_admin'.
-- Unverified legacy admin accounts are retained under an unprivileged review status ('legacy_admin_pending')
-- unless explicitly designated in verified administrative seed lists.

-- 1. Safely normalize legacy 'candidate' to canonical 'student'
UPDATE users 
SET role = 'student' 
WHERE role = 'candidate';

-- 2. Prevent blind privilege escalation:
-- Retain unverified legacy admin accounts under an unprivileged review status ('legacy_admin_pending')
UPDATE users
SET role = 'legacy_admin_pending'
WHERE role = 'admin' AND email != 'admin@skillverse.test';

-- 3. Explicit verified root administrator
UPDATE users
SET role = 'super_admin'
WHERE role = 'admin' AND email = 'admin@skillverse.test';
