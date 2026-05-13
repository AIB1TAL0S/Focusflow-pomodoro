#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  console.log('Testing Supabase token revocation behavior...\n');
  
  // Sign in
  const { data: signInData } = await supabase.auth.signInWithPassword({
    email: 'signouttest@focusflow.test',
    password: 'SignOutTest@2024',
  });
  
  const token = signInData.session.access_token;
  console.log('✅ Signed in, access token:', token.substring(0, 30) + '...');
  
  // Sign out with scope: 'global'
  console.log('\n📤 Calling signOut({ scope: "global" })...');
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  console.log('   SignOut error:', error || 'none');
  
  // Wait for server-side processing
  await new Promise(r => setTimeout(r, 1000));
  
  // Try using the token
  console.log('\n🔍 Testing if access token still works...');
  const resp = await fetch(process.env.EXPO_PUBLIC_SUPABASE_URL + '/auth/v1/user', {
    headers: {
      'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + token,
    },
  });
  console.log('   HTTP status:', resp.status);
  
  if (resp.status === 200) {
    console.log('   ⚠️  Token is STILL VALID after signOut({ scope: "global" })');
    console.log('   This is expected Supabase behavior — JWTs remain valid until expiry.');
    console.log('   The refresh token is revoked, preventing new access tokens.');
  } else {
    console.log('   ✅ Token was revoked');
  }
})();
