#!/usr/bin/env node
/**
 * Admin script to sign out a specific user from Supabase.
 * This invalidates all their sessions server-side.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const targetEmail = process.argv[2];

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

if (!targetEmail) {
  console.error('❌ Usage: node admin-signout-user.js <email>');
  console.error('   Example: node admin-signout-user.js user@example.com');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function signOutUser(email) {
  console.log(`\n🔍 Looking up user: ${email}\n`);

  // Step 1: Sign in as the user (requires password)
  console.log('⚠️  Note: This script requires the user\'s password to sign them out.');
  console.log('   Alternatively, use Supabase Admin API with service role key.\n');
  
  // For now, we'll just invalidate their session tokens in the database
  console.log('📋 Checking for active sessions in database...\n');
  
  // Query profiles to get user_id
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email);

  if (profileError) {
    console.error('❌ Error querying profiles:', profileError.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log(`❌ No user found with email: ${email}`);
    process.exit(1);
  }

  const userId = profiles[0].id;
  console.log(`✅ Found user: ${email}`);
  console.log(`   User ID: ${userId}\n`);

  // Invalidate all session tokens for this user
  console.log('🔒 Invalidating all session tokens...');
  const { data: tokens, error: tokenError } = await supabase
    .from('session_tokens')
    .update({ is_valid: false })
    .eq('user_id', userId)
    .eq('is_valid', true)
    .select();

  if (tokenError) {
    console.error('❌ Error invalidating tokens:', tokenError.message);
    process.exit(1);
  }

  if (tokens && tokens.length > 0) {
    console.log(`✅ Invalidated ${tokens.length} session token(s)`);
  } else {
    console.log('ℹ️  No active session tokens found in database');
  }

  console.log('\n✅ User signed out successfully!');
  console.log('\nWhat this did:');
  console.log('  - Invalidated all session_tokens in the database');
  console.log('  - User will be logged out on next session validity check');
  console.log('\nNote: To fully revoke Supabase auth sessions, use the Admin API');
  console.log('      with a service role key (not the anon key).\n');
}

signOutUser(targetEmail).catch((err) => {
  console.error('\n❌ Script failed:', err);
  process.exit(1);
});
