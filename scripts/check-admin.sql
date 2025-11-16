-- Check if hello@watzy.app is an admin
SELECT * FROM admins WHERE email = 'hello@watzy.app';

-- Also check the user_id
SELECT u.id, u.email, a.email as admin_email, a.is_active
FROM auth.users u
LEFT JOIN admins a ON u.id = a.user_id
WHERE u.email = 'hello@watzy.app';
