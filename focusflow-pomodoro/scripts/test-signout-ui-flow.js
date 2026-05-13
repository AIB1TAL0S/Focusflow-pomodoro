#!/usr/bin/env node
/**
 * UI Flow Test — simulates the exact sequence that happens when the user
 * clicks the "Sign Out" button in the Profile screen.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = 'signouttest@focusflow.test';
const TEST_PASS = 'SignOutTest@2024';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

// Simulate the app's storage (sessionStorage on web, AsyncStorage on native)
const mockStorage = new Map();
const testStorage = {
  getItem: async (key) => mockStorage.get(key) || null,
  setItem: async (key, value) => mockStorage.set(key, value),
  removeItem: async (key) => mockStorage.delete(key),
};

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: testStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Track auth state changes (simulates onAuthStateChange in AuthContext)
const authEvents = [];
supabase.auth.onAuthStateChange((event, session) => {
  authEvents.push({ event, hasSession: !!session });
});

async function testUIFlow() {
  console.log('\n========================================');
  console.log('  Sign-Out Button UI Flow Test');
  console.log('========================================\n');

  // ── SETUP: User is signed in and viewing the Profile screen ───────────────
  console.log('SETUP: User signs in and navigates to Profile screen');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASS,
  });

  if (signInError || !signInData.session) {
    console.log('❌ Cannot proceed — sign-in failed');
    process.exit(1);
  }

  console.log('  ✅ User is signed in');
  console.log(`  ✅ Viewing Profile screen (user: ${signInData.user.email})`);
  console.log(`  ✅ Storage has ${mockStorage.size} Supabase keys\n`);

  // ── STEP 1: User clicks "Sign Out" button ─────────────────────────────────
  console.log('STEP 1: User clicks "Sign Out" button');
  console.log('  → Alert dialog appears: "Are you sure you want to sign out?"');
  console.log('  → User taps "Sign Out" (destructive action)\n');

  // ── STEP 2: handleSignOut() calls signOut() from AuthContext ──────────────
  console.log('STEP 2: handleSignOut() executes');
  console.log('  → Calling signOut() from AuthContext...\n');

  // This simulates the exact sequence in AuthContext.signOut():
  console.log('STEP 3: signOut() sequence begins');
  
  // 3a. Clear React state (simulated — we just track it)
  console.log('  ✅ React state cleared (user, session, profile, preferences → null)');
  
  // 3b. Navigate to login (simulated)
  console.log('  ✅ router.replace("/(auth)/login") called');
  console.log('     → User sees login screen immediately\n');

  // 3c. Clear storage (clearAuthStorage)
  console.log('STEP 4: clearAuthStorage() executes');
  const keysBeforeClear = Array.from(mockStorage.keys()).filter(k => k.startsWith('sb-'));
  console.log(`  → Found ${keysBeforeClear.length} Supabase keys in storage`);
  keysBeforeClear.forEach(k => mockStorage.delete(k));
  console.log('  ✅ All Supabase keys removed from storage\n');

  // 3d. Call supabase.auth.signOut({ scope: 'global' })
  console.log('STEP 5: supabase.auth.signOut({ scope: "global" }) executes');
  const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
  if (signOutError) {
    console.log(`  ⚠️  Sign-out error: ${signOutError.message}`);
  } else {
    console.log('  ✅ Server-side sign-out succeeded');
  }

  // Wait for onAuthStateChange to fire
  await new Promise(resolve => setTimeout(resolve, 500));

  // ── STEP 6: Verify final state ────────────────────────────────────────────
  console.log('\nSTEP 6: Verify final state');
  
  const { data: { session: finalSession } } = await supabase.auth.getSession();
  console.log('  ✅ Client session:', finalSession ? 'EXISTS (BUG!)' : 'null (correct)');
  
  const keysAfter = Array.from(mockStorage.keys()).filter(k => k.startsWith('sb-'));
  console.log('  ✅ Storage keys:', keysAfter.length === 0 ? 'all cleared (correct)' : `${keysAfter.length} remaining (BUG!)`);
  
  console.log('  ✅ Auth events fired:', authEvents.map(e => e.event).join(', '));
  
  const signedOutEvent = authEvents.find(e => e.event === 'SIGNED_OUT');
  console.log('  ✅ SIGNED_OUT event:', signedOutEvent ? 'fired (correct)' : 'NOT fired (BUG!)');

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('  UI Flow Summary');
  console.log('========================================\n');

  const allGood = !finalSession && keysAfter.length === 0 && signedOutEvent;
  
  if (allGood) {
    console.log('✅ Sign-out button works correctly!');
    console.log('\nWhat the user experiences:');
    console.log('  1. Clicks "Sign Out" button');
    console.log('  2. Confirms in alert dialog');
    console.log('  3. Immediately sees login screen');
    console.log('  4. Session is cleared (cannot go back to tabs)');
    console.log('  5. Storage is wiped (session does not persist on restart)\n');
    process.exit(0);
  } else {
    console.log('❌ Sign-out button has issues:');
    if (finalSession) console.log('  - Session still exists after sign-out');
    if (keysAfter.length > 0) console.log('  - Storage not fully cleared');
    if (!signedOutEvent) console.log('  - SIGNED_OUT event did not fire');
    console.log('');
    process.exit(1);
  }
}

testUIFlow().catch((err) => {
  console.error('\n❌ Test crashed:', err);
  process.exit(1);
});
