// Comprehensive test for Supabase signOut with app-like configuration
// Run with: node scripts/test-signout-full.js

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

// Create client with same config as app
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

async function testSignOutFlow() {
  console.log('=== Full SignOut Flow Test ===\n');

  // Step 1: Check initial session
  console.log('Step 1: Check initial session');
  const { data: initialSession } = await supabase.auth.getSession();
  console.log('  Initial session:', initialSession.session ? 'EXISTS' : 'NONE');

  // Step 2: Call signOut
  console.log('\nStep 2: Call signOut()');
  const signOutResult = await supabase.auth.signOut();
  console.log('  signOut error:', signOutResult.error ? signOutResult.error.message : 'null');

  // Step 3: Check session after signOut
  console.log('\nStep 3: Check session after signOut');
  const { data: afterSignOut } = await supabase.auth.getSession();
  console.log('  Session after signOut:', afterSignOut.session ? 'EXISTS' : 'NONE');

  // Step 4: Test signOut event callback
  console.log('\nStep 4: Test onAuthStateChange callback');
  let eventReceived = null;
  let sessionReceived = null;

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    eventReceived = event;
    sessionReceived = session;
  });

  // Trigger signOut again to see event
  await supabase.auth.signOut();

  // Give callback time to fire
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('  Event received:', eventReceived);
  console.log('  Session in callback:', sessionReceived ? 'EXISTS' : 'null');

  subscription.unsubscribe();

  console.log('\n=== Test complete ===');
}

testSignOutFlow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
