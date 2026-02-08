-- Check if your-email@example.com is an admin
SELECT * FROM admins WHERE email = 'your-email@example.com';

-- Also check the user_id
SELECT u.id, u.email, a.email as admin_email, a.is_active
FROM auth.users u
LEFT JOIN admins a ON u.id = a.user_id
WHERE u.email = 'your-email@example.com';
