import type { APIRoute } from 'astro';
import { teamMemberQueries } from 'src/lib/db/admin/team-member-queries';
import { validateAuthHeader, createAuthErrorResponse } from 'src/lib/auth/api-jwt-validator';

/**
 * POST /api/admin/team-members/sync
 *
 * Syncs the current authenticated user with the TeamMembers table
 * - Validates JWT token from Authorization header
 * - If user exists (by cognito_sub), updates last_seen_at and sets is_online = 1
 * - If user doesn't exist, creates a new TeamMember record
 *
 * Headers: Authorization: Bearer <jwt_token>
 * Body: { email: string, cognito_sub: string, name?: string }
 * Returns: { success: true, data: TeamMember }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Validate JWT token from Authorization header
    const auth = validateAuthHeader(request);
    if (!auth.success) {
      console.error('[API] /api/admin/team-members/sync - Auth failed:', auth.error);
      return createAuthErrorResponse(auth);
    }

    const runtime = locals.runtime;
    const db = runtime?.env?.INTERNAL_OPS_ADMIN_DB;

    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.email || !data.cognito_sub) {
      return new Response(
        JSON.stringify({ error: 'email and cognito_sub are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify cognito_sub matches JWT token
    if (data.cognito_sub !== auth.user?.sub) {
      return new Response(
        JSON.stringify({ error: 'cognito_sub does not match authenticated user' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API] Syncing user:', data.email, data.cognito_sub);

    // Upsert user
    const result = await teamMemberQueries.upsertByCognitoSub(db, {
      cognito_sub: data.cognito_sub,
      email: data.email,
      name: data.name,
    });

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Failed to sync user' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API] User synced successfully:', result.id, result.email);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: 'User synced successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error syncing team member:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to sync team member',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
