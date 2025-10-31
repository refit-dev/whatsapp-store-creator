// ALTERNATIVE AUTH METHOD - Test this in browser console
// Go to your signup page and run this in browser console (F12)

// Method 1: Direct API call to Supabase
async function testDirectSignup() {
  const response = await fetch('https://iazdsuodmyymclqltenc.supabase.co/auth/v1/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhemRzdW9kbXl5bWNscWx0ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjQ4MzUsImV4cCI6MjA3NjAwMDgzNX0.By1PwgQDmoT4aQjv4m36Chgassg_pkz1IXP-KKHfxxk'
    },
    body: JSON.stringify({
      email: 'directtest@example.com',
      password: 'password123'
    })
  });
  
  const result = await response.json();
  console.log('Direct API result:', result);
  return result;
}

// Method 2: Test with minimal Supabase client
async function testMinimalClient() {
  const { createClient } = supabase;
  const client = createClient(
    'https://iazdsuodmyymclqltenc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhemRzdW9kbXl5bWNscWx0ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjQ4MzUsImV4cCI6MjA3NjAwMDgzNX0.By1PwgQDmoT4aQjv4m36Chgassg_pkz1IXP-KKHfxxk'
  );
  
  const { data, error } = await client.auth.signUp({
    email: 'minimaltest@example.com',
    password: 'password123'
  });
  
  console.log('Minimal client result:', { data, error });
  return { data, error };
}

// Run these tests:
console.log('Testing direct API...');
testDirectSignup();

console.log('Testing minimal client...');
testMinimalClient();