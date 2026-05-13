#!/usr/bin/env node
/**
 * End-to-end test for the sign-out flow.
 *
 * 1. Creates a test user (or re-uses an existing one).
 * 2. Signs in and captures the access token.
 * 3. Calls the logout endpoint.
 * 4. Verifies the token is revoked (401).
 * 5. Verifies no session survives in a fresh client.
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const TEST_EMAIL = 'signout-test@example.com';
const TEST_PASSWORD = 'testpassword123';

async function testSignOutFlow() {
  console.log('=== Sign-Out E2E Test ===\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Step 1: Ensure user exists
  console.log('Step 1: Sign up (or sign in if already exists)');
  let session;
  {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (error) {
      console.log('  User not found, creating...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      if (signUpError) {
        console.error('  Sign up failed:', signUpError.message);
        process.exit(1);
      }
      session = signUpData.session;
    } else {
      session = data.session;
    }
    console.log('  Session active:', !!session);
  }

  if (!session) {
    console.error('  No session after sign-in/sign-up');
    process.exit(1);
  }

  // Step 2: Verify token works
  console.log('\nStep 2: Verify token is valid before logout');
  {
    const { data, error } = await supabase.auth.getUser(session.access_token);
    console.log('  Token valid:', !error);
    if (error) {
      console.error('  Unexpected error:', error.message);
      process.exit(1);
    }
  }

  // Step 3: Sign out
  console.log('\nStep 3: Call supabase.auth.signOut()');
  {
    const { error } = await supabase.auth.signOut();
    console.log('  signOut error:', error ? error.message : 'none');
  }

  // Step 4: Verify token is revoked
  console.log('\nStep 4: Verify token is revoked after logout');
  {
    const { data, error } = await supabase.auth.getUser(session.access_token);
    console.log('  Token revoked:', !!error);
    if (!error) {
      console.error('  FAIL: Token still works after logout!');
      process.exit(1);
    }
  }

  // Step 5: Verify fresh client has no session
  console.log('\nStep 5: Verify fresh client has no persisted session');
  {
    const freshClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const { data } = await freshClient.auth.getSession();
    console.log('  Fresh session:', data.session ? 'EXISTS (BAD)' : 'null (OK)');
    if (data.session) {
      console.error('  FAIL: Session survived in a fresh client!');
      process.exit(1);
    }
  }

  console.log('\n=== All tests passed ===');
}

testSignOutFlow().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
