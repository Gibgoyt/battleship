import type { APIRoute } from 'astro';
import { teamMemberQueries } from 'src/lib/db/admin/team-member-queries';

/**
 * POST /api/admin/team-members/sync
 *
 * Syncs the current authenticated user with the TeamMembers table
 * - If user exists (by cognito_sub), updates last_seen_at and sets is_online = 1
 * - If user doesn't exist, creates a new TeamMember record
 *
 * Body: { email: string, cognito_sub: string, name?: string }
 * Returns: { success: true, data: TeamMember }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
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
