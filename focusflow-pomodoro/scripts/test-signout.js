// Test script to verify Supabase auth signOut behavior
// Run with: node scripts/test-signout.js

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testSignOut() {
  console.log('=== Testing Supabase signOut API ===\n');

  // Test 1: signOut without active session
  console.log('Test 1: signOut without active session');
  try {
    const { error } = await supabase.auth.signOut();
    console.log('  Result:', error ? `Error: ${error.message}` : 'Success (no error)');
  } catch (err) {
    console.log('  Exception:', err.message);
  }

  // Test 2: signIn then signOut
  console.log('\nTest 2: signIn then signOut');
  // Note: This requires valid credentials, so we'll just document the expected behavior
  console.log('  To fully test, run:');
  console.log('    const { data } = await supabase.auth.signInWithPassword({ email, password });');
  console.log('    console.log("Session:", data.session ? "active" : "none");');
  console.log('    await supabase.auth.signOut();');
  console.log('    const { data: after } = await supabase.auth.getSession();');
  console.log('    console.log("After signOut:", after.session ? "active" : "cleared");');

  // Test 3: Check what signOut returns
  console.log('\nTest 3: Checking signOut return type');
  const result = await supabase.auth.signOut();
  console.log('  Return keys:', Object.keys(result));
  console.log('  Error:', result.error);

  console.log('\n=== Tests complete ===');
}

testSignOut().catch(console.error);
