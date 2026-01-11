#!/usr/bin/env -S node --experimental-strip-types

import { getJwt, loadUser } from '../JwtAuth.ts'
import { staleTestUser7Token } from '../tokens/index.ts'

// Command-line argument routing
// ./main.ts <functionName>
// ./main.ts test_refreshMechanism401 <User>
const args = process.argv.slice(2)

if (args[0] === 'test_refreshMechanism401') {
  const username = args[1]
  if (!username) {
    console.error("Please run ./main.ts test_refreshMechanism401 <USERNAME_HERE>")
    process.exit(1)
  }
  await test_refreshMechanism401(username)
} else if (args[0] === 'test_staleTokenFailure') {
  await test_staleTokenFailure()
} else if (args[0] === 'test_freshTokenSuccess') {
  const username = args[1]
  if (!username) {
    console.error("Please run ./main.ts test_freshTokenSuccess <USERNAME_HERE>")
    process.exit(1)
  }
  await test_freshTokenSuccess(username)
} else if (args[0] === 'test_middlewareFetch') {
  const username = args[1]
  if (!username) {
    console.error("Please run ./main.ts test_middlewareFetch <USERNAME_HERE>")
    process.exit(1)
  }
  await test_middlewareFetch(username)
} else if (args[0] === 'test_staleTokenToExpectedRefresh') {
  await test_staleTokenToExpectedRefresh()
} else {
  console.log("Available commands:")
  console.log("  ./main.ts test_refreshMechanism401 <username>    - Test 401 refresh mechanism")
  console.log("  ./main.ts test_staleTokenFailure                - Test stale token failure")
  console.log("  ./main.ts test_freshTokenSuccess <username>      - Test fresh token success")
  console.log("  ./main.ts test_middlewareFetch <username>        - Test new middleware system")
  console.log("  ./main.ts test_staleTokenToExpectedRefresh       - Test stale token with refresh mechanism")
  console.log("")
  console.log("Available users: TestUser1, TestUser2, TestUser3, TestUser4, TestUser5, TestUser6, TestUser7")
  process.exit(1)
}

/**
 * Test the refresh mechanism with 401 responses
 * Step 1: Login with Firebase to get fresh token
 * Step 2: Test against hello/firebase endpoint
 */
async function test_refreshMechanism401(username: string) {
  console.log(`🧪 Testing refresh mechanism for user: ${username}`)
  console.log("=".repeat(50))

  try {
    // Step 1: Login with Firebase
    console.log("📋 Step 1: Authenticating with Firebase...")
    const authResponse = await getJwt(username)
    console.log(`✅ Authentication successful!`)
    console.log(`   User ID: ${authResponse.localId}`)
    console.log(`   Email: ${authResponse.email}`)
    console.log(`   Token expires in: ${authResponse.expiresIn} seconds`)
    console.log(`   Token (first 20 chars): ${authResponse.idToken.substring(0, 20)}...`)

    // Step 2: Test against hello/firebase endpoint
    console.log("\n📋 Step 2: Testing against hello/firebase endpoint...")

    const response = await fetch('https://devbackend.splitdo.app:8443/api/hello/firebase', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authResponse.idToken}`,
        'Content-Type': 'application/json',
        'Origin': 'https://splitdo.app'
      }
    })

    const responseData = await response.json()

    if (response.ok) {
      console.log(`✅ Hello endpoint successful!`)
      console.log(`   Status: ${response.status} ${response.statusText}`)
      console.log(`   Authenticated: ${responseData.authenticated}`)
      console.log(`   User ID: ${responseData.user?.id}`)
      console.log(`   Token expires at: ${new Date(responseData.token_info?.expires_at * 1000).toISOString()}`)
    } else {
      console.log(`❌ Hello endpoint failed!`)
      console.log(`   Status: ${response.status} ${response.statusText}`)
      console.log(`   Error: ${responseData.error}`)
      console.log(`   Message: ${responseData.message}`)
    }

    // Step 3: Test balance endpoint (which should use our new middleware)
    console.log("\n📋 Step 3: Testing balance endpoint with fresh token...")
    await testBalanceEndpoint(authResponse.idToken)

  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  }
}

/**
 * Test with the known stale TestUser7 token to trigger 401
 */
async function test_staleTokenFailure() {
  console.log(`🧪 Testing stale token failure mechanism`)
  console.log("=".repeat(50))

  console.log("📋 Using pre-stored stale TestUser7 token...")
  console.log(`   Token (first 20 chars): ${staleTestUser7Token.substring(0, 20)}...`)

  try {
    const response = await fetch('https://devbackend.splitdo.app:8443/api/hello/firebase', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${staleTestUser7Token}`,
        'Content-Type': 'application/json',
        'Origin': 'https://splitdo.app'
      }
    })

    const responseData = await response.json()

    if (response.status === 401 || (response.ok && !responseData.authenticated)) {
      console.log(`✅ Stale token correctly rejected!`)
      console.log(`   Status: ${response.status} ${response.statusText}`)
      console.log(`   Authenticated: ${responseData.authenticated}`)
      console.log(`   Error: ${responseData.error}`)
      console.log(`   Message: ${responseData.message}`)
    } else {
      console.log(`⚠️  Unexpected response - token may not be stale:`)
      console.log(`   Status: ${response.status} ${response.statusText}`)
      console.log(`   Response:`, responseData)
    }

    // Test balance endpoint with stale token
    console.log("\n📋 Testing balance endpoint with stale token...")
    await testBalanceEndpoint(staleTestUser7Token)

  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  }
}

/**
 * Test with fresh token for successful case
 */
async function test_freshTokenSuccess(username: string) {
  console.log(`🧪 Testing fresh token success for user: ${username}`)
  console.log("=".repeat(50))

  try {
    // Get fresh token
    const authResponse = await getJwt(username)
    console.log(`✅ Fresh token obtained for ${authResponse.email}`)

    // Test hello endpoint
    const response = await fetch('https://devbackend.splitdo.app:8443/api/hello/firebase', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authResponse.idToken}`,
        'Content-Type': 'application/json',
        'Origin': 'https://splitdo.app'
      }
    })

    const responseData = await response.json()

    console.log(`📊 Response: ${response.status} ${response.statusText}`)
    console.log(`   Authenticated: ${responseData.authenticated}`)
    console.log(`   User: ${responseData.user?.email}`)

  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  }
}

/**
 * Test the new middleware fetch system (simulated)
 * This would require importing the actual middleware which needs browser environment
 */
async function test_middlewareFetch(username: string) {
  console.log(`🧪 Testing middleware fetch system simulation for user: ${username}`)
  console.log("=".repeat(50))

  try {
    // Get fresh token
    console.log("📋 Step 1: Getting fresh token...")
    const authResponse = await getJwt(username)
    console.log(`✅ Fresh token obtained`)

    // Simulate the middleware fetch behavior
    console.log("\n📋 Step 2: Simulating middleware fetch behavior...")
    await simulateMiddlewareFetch(authResponse.idToken)

    // Test with stale token to simulate refresh
    console.log("\n📋 Step 3: Testing refresh mechanism with stale token...")
    await simulateMiddlewareFetchWithStaleToken()

  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  }
}

/**
 * Simulate the middleware fetch behavior
 */
async function simulateMiddlewareFetch(token: string) {
  console.log("🔄 Simulating fetchMiddleware behavior...")

  // Test 1: Valid token should work
  const response = await makeRequestWithRetry('https://devbackend.splitdo.app:8443/api/hello/firebase', token)

  if (response.success) {
    console.log(`✅ Middleware simulation successful`)
    console.log(`   Status: ${response.status}`)
    console.log(`   User: ${response.data.user?.email}`)
  } else {
    console.log(`❌ Middleware simulation failed`)
    console.log(`   Status: ${response.status}`)
    console.log(`   Error: ${response.error}`)
  }
}

/**
 * Simulate middleware fetch with stale token and refresh
 */
async function simulateMiddlewareFetchWithStaleToken() {
  console.log("🔄 Simulating middleware refresh mechanism...")

  // Use stale token first
  let response = await makeRequestWithRetry('https://devbackend.splitdo.app:8443/api/hello/firebase', staleTestUser7Token)

  if (!response.success && (response.status === 401 || response.status === 403)) {
    console.log(`🔄 First request failed with ${response.status}, simulating token refresh...`)

    // Simulate refresh by getting new token
    const authResponse = await getJwt('TestUser7')
    console.log(`🔄 Token refreshed successfully`)

    // Retry with fresh token
    response = await makeRequestWithRetry('https://devbackend.splitdo.app:8443/api/hello/firebase', authResponse.idToken)

    if (response.success) {
      console.log(`✅ Retry after refresh successful!`)
      console.log(`   Status: ${response.status}`)
      console.log(`   User: ${response.data.user?.email}`)
    } else {
      console.log(`❌ Retry after refresh still failed`)
      console.log(`   Status: ${response.status}`)
      console.log(`   Error: ${response.error}`)
    }
  } else {
    console.log(`⚠️  Unexpected: stale token didn't fail as expected`)
  }
}

/**
 * Test the balance endpoint with given token
 */
async function testBalanceEndpoint(token: string) {
  try {
    const response = await fetch('https://devbackend.splitdo.app:8443/api/splitdo-token/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'https://splitdo.app'
      }
    })

    const responseData = await response.json()

    console.log(`📊 Balance endpoint response: ${response.status} ${response.statusText}`)

    if (response.ok) {
      console.log(`✅ Balance retrieved successfully`)
      console.log(`   User ID: ${responseData.user_id}`)
      console.log(`   Balance: ${responseData.mainnet_response?.balance}`)
      console.log(`   Token Account: ${responseData.token_account_pubkey}`)
    } else {
      console.log(`❌ Balance request failed`)
      console.log(`   Error: ${responseData.error}`)
      console.log(`   Message: ${responseData.message}`)
    }

  } catch (error) {
    console.error(`❌ Balance endpoint test failed:`, error)
  }
}

/**
 * Make request with basic retry logic (simulates middleware)
 */
async function makeRequestWithRetry(url: string, token: string): Promise<{
  success: boolean,
  status: number,
  data?: any,
  error?: string
}> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'https://splitdo.app'
      }
    })

    const data = await response.json()

    return {
      success: response.ok,
      status: response.status,
      data: response.ok ? data : undefined,
      error: !response.ok ? data.error || data.message || 'Unknown error' : undefined
    }

  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Test stale token with expected refresh mechanism
 * Simulates our fetchMiddleware behavior: try with stale token, get 401, refresh, retry
 */
async function test_staleTokenToExpectedRefresh() {
  console.log(`🧪 Testing stale token with refresh mechanism`)
  console.log("=".repeat(50))

  console.log("📋 Step 1: Testing with pre-stored stale TestUser7 token...")
  console.log(`   Token (first 20 chars): ${staleTestUser7Token.substring(0, 20)}...`)

  try {
    // Step 1: Try with stale token first
    let response = await fetch('https://devbackend.splitdo.app:8443/api/hello/firebase', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${staleTestUser7Token}`,
        'Content-Type': 'application/json',
        'Origin': 'https://splitdo.app'
      }
    })

    let responseData = await response.json()

    console.log(`📊 First attempt result: ${response.status} ${response.statusText}`)
    console.log(`   Authenticated: ${responseData.authenticated}`)

    if (responseData.error) {
      console.log(`   Error: ${responseData.error}`)
      console.log(`   Message: ${responseData.message}`)
    }

    // Step 2: Check if we got 401 or authentication failed
    const shouldRefresh = response.status === 401 ||
                         response.status === 403 ||
                         (response.ok && !responseData.authenticated)

    if (shouldRefresh) {
      console.log("\n🔄 Step 2: 401/403 or authentication failed detected - triggering refresh...")

      // Get fresh token for TestUser7 (simulates refresh mechanism)
      console.log("   🔐 Refreshing token via Firebase authentication...")
      const authResponse = await getJwt('TestUser7')

      console.log(`   ✅ Token refreshed successfully!`)
      console.log(`   📝 New token (first 20 chars): ${authResponse.idToken.substring(0, 20)}...`)
      console.log(`   ⏰ New token expires in: ${authResponse.expiresIn} seconds`)

      // Step 3: Retry with fresh token
      console.log("\n🔄 Step 3: Retrying request with fresh token...")

      response = await fetch('https://devbackend.splitdo.app:8443/api/hello/firebase', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authResponse.idToken}`,
          'Content-Type': 'application/json',
          'Origin': 'https://splitdo.app'
        }
      })

      responseData = await response.json()

      console.log(`📊 Retry result: ${response.status} ${response.statusText}`)
      console.log(`   Authenticated: ${responseData.authenticated}`)

      if (response.ok && responseData.authenticated) {
        console.log(`   ✅ SUCCESS! Refresh mechanism worked!`)
        console.log(`   👤 User: ${responseData.user?.email}`)
        console.log(`   🔑 User ID: ${responseData.user?.id}`)
        console.log(`   🕒 Token expires at: ${new Date(responseData.token_info?.expires_at * 1000).toISOString()}`)
      } else {
        console.log(`   ❌ Retry still failed after refresh`)
        if (responseData.error) {
          console.log(`   Error: ${responseData.error}`)
          console.log(`   Message: ${responseData.message}`)
        }
      }

      // Step 4: Test balance endpoint with fresh token
      console.log("\n📋 Step 4: Testing balance endpoint with fresh token...")
      await testBalanceEndpoint(authResponse.idToken)

    } else {
      console.log("\n⚠️  Unexpected: stale token didn't fail as expected")
      console.log("   No refresh was triggered - token may not be stale")
    }

  } catch (error) {
    console.error("❌ Refresh mechanism test failed:", error)
    process.exit(1)
  }
}