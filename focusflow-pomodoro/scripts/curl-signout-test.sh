#!/usr/bin/env bash

SUPABASE_URL="https://ultwttnusgjrabqbdrfc.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsdHd0dG51c2dqcmFicWJkcmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTUyODAsImV4cCI6MjA5NDE3MTI4MH0.I5GNE-lB6F0C-ZMpAmqcHi_jCyHo2Ay3W-Vu2FI-PmU"
TEST_EMAIL="curltestuser@focusflow.dev"
TEST_PASS="CurlTest@1234"

PASS=0
FAIL=0

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  local detail="$4"
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ PASS — $label (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    echo "  ❌ FAIL — $label (expected HTTP $expected, got HTTP $actual)"
    [ -n "$detail" ] && echo "     $detail"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "========================================"
echo "  FocusFlow Sign-Out API Test Suite"
echo "========================================"

# ── SETUP: Sign in to get a fresh session ────────────────────────────────────
echo ""
echo "SETUP: Sign in as $TEST_EMAIL"
SIGNIN=$(curl -s -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}")

ACCESS_TOKEN=$(echo "$SIGNIN" | jq -r '.access_token // empty')
REFRESH_TOKEN=$(echo "$SIGNIN" | jq -r '.refresh_token // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "  ❌ Could not sign in — aborting tests"
  echo "  Response: $SIGNIN"
  exit 1
fi
echo "  ✅ Signed in — got access + refresh tokens"

# ── TEST 1: Session is valid before sign-out ─────────────────────────────────
echo ""
echo "TEST 1: GET /auth/v1/user — session valid before sign-out"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$SUPABASE_URL/auth/v1/user" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
check "Session active before sign-out" "200" "$STATUS"

# ── TEST 2: Sign out (global scope) ──────────────────────────────────────────
echo ""
echo "TEST 2: POST /auth/v1/logout?scope=global — sign out"
SIGNOUT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$SUPABASE_URL/auth/v1/logout?scope=global" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")
# Supabase returns 204 No Content on success
if [ "$SIGNOUT_STATUS" = "204" ] || [ "$SIGNOUT_STATUS" = "200" ]; then
  echo "  ✅ PASS — Sign-out endpoint returned HTTP $SIGNOUT_STATUS"
  PASS=$((PASS + 1))
else
  echo "  ❌ FAIL — Sign-out returned HTTP $SIGNOUT_STATUS (expected 204)"
  FAIL=$((FAIL + 1))
fi

# ── TEST 3: Access token rejected after sign-out ─────────────────────────────
echo ""
echo "TEST 3: GET /auth/v1/user — access token must be rejected after sign-out"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$SUPABASE_URL/auth/v1/user" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
# Supabase returns 403 (not 401) for revoked tokens — both mean "rejected"
if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
  echo "  ✅ PASS — Access token rejected post sign-out (HTTP $STATUS)"
  PASS=$((PASS + 1))
else
  echo "  ❌ FAIL — Access token still accepted after sign-out (HTTP $STATUS)"
  FAIL=$((FAIL + 1))
fi

# ── TEST 4: Refresh token revoked after sign-out ─────────────────────────────
echo ""
echo "TEST 4: POST /auth/v1/token?grant_type=refresh_token — refresh token must be revoked"
REFRESH_RESP=$(curl -s -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=refresh_token" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")
REFRESH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=refresh_token" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")
ERROR_CODE=$(echo "$REFRESH_RESP" | jq -r '.error_code // .error // "none"' 2>/dev/null)
if [ "$REFRESH_STATUS" = "400" ] || [ "$REFRESH_STATUS" = "401" ]; then
  echo "  ✅ PASS — Refresh token revoked (HTTP $REFRESH_STATUS, error: $ERROR_CODE)"
  PASS=$((PASS + 1))
else
  echo "  ❌ FAIL — Refresh token still valid (HTTP $REFRESH_STATUS — expected 400/401)"
  FAIL=$((FAIL + 1))
fi

# ── TEST 5: Sign-out is idempotent (calling again doesn't crash) ──────────────
echo ""
echo "TEST 5: POST /auth/v1/logout — sign-out with expired token is safe"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$SUPABASE_URL/auth/v1/logout?scope=global" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")
# 401/403 are both acceptable — the token is already gone, server rejects gracefully
if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ] || [ "$STATUS" = "204" ] || [ "$STATUS" = "200" ]; then
  echo "  ✅ PASS — Repeated sign-out handled gracefully (HTTP $STATUS)"
  PASS=$((PASS + 1))
else
  echo "  ❌ FAIL — Unexpected status on repeated sign-out (HTTP $STATUS)"
  FAIL=$((FAIL + 1))
fi

# ── SUMMARY ──────────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo "  Results: $PASS passed, $FAIL failed"
echo "========================================"
echo ""
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
