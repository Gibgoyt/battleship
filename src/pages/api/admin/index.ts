import type { APIRoute } from 'astro';
import { teamMemberQueries } from 'src/lib/db/admin/team-member-queries';
import { projectStageQueries } from 'src/lib/db/admin/project-stage-queries';
import { productIssueQueries } from 'src/lib/db/admin/product-issue-queries';
import { developmentIssueQueries } from 'src/lib/db/admin/development-issue-queries';
import { validateAuthHeader, createAuthErrorResponse } from 'src/lib/auth/api-jwt-validator';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Validate JWT token from Authorization header
    const auth = validateAuthHeader(request);
    if (!auth.success) {
      console.error('[API] /api/admin - Auth failed:', auth.error);
      return createAuthErrorResponse(auth);
    }

    console.log('[API] /api/admin - Authenticated user:', auth.user?.email);

    const runtime = locals.runtime;
    const db = runtime?.env?.INTERNAL_OPS_ADMIN_DB;

    if (!db) {
      return new Response(
        JSON.stringify({
          error: 'Database not configured',
          message: 'INTERNAL_OPS_ADMIN_DB binding not found.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 1. First, ensure user exists in database (create if doesn't exist)
    if (auth.user?.sub && auth.user?.email) {
      console.log('[API] /api/admin - Syncing user to database:', auth.user.email);

      await teamMemberQueries.upsertByCognitoSub(db, {
        cognito_sub: auth.user.sub,
        email: auth.user.email,
        name: auth.user.email,
      });

      console.log('[API] /api/admin - User synced successfully');
    }

    // 2. Fetch all data in parallel
    const [teamMembers, projectStages, productIssues, developmentIssues] = await Promise.all([
      teamMemberQueries.getAll(db),
      projectStageQueries.getAllWithIssueCounts(db),
      productIssueQueries.getAll(db),
      developmentIssueQueries.getAll(db),
    ]);

    // Calculate dashboard stats
    const stats = {
      total_team_members: teamMembers.results?.length || 0,
      online_team_members: teamMembers.results?.filter((m) => m.is_online === 1).length || 0,
      total_product_issues: productIssues.results?.length || 0,
      total_development_issues: developmentIssues.results?.length || 0,
      open_product_issues: productIssues.results?.filter((i) => i.status === 'open').length || 0,
      open_development_issues: developmentIssues.results?.filter((i) => i.status === 'open').length || 0,
      total_project_stages: projectStages.results?.length || 0,
      current_stage: projectStages.results?.find((s) => s.status === 'current')?.title || null,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          team_members: teamMembers.results || [],
          project_stages: projectStages.results || [],
          product_issues: productIssues.results || [],
          development_issues: developmentIssues.results || [],
          stats,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching admin data:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch admin data',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
