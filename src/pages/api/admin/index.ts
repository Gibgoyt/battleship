import type { APIRoute } from 'astro';
import { teamMemberQueries } from 'src/lib/db/admin/team-member-queries';
import { projectStageQueries } from 'src/lib/db/admin/project-stage-queries';
import { productIssueQueries } from 'src/lib/db/admin/product-issue-queries';
import { developmentIssueQueries } from 'src/lib/db/admin/development-issue-queries';

export const GET: APIRoute = async ({ locals }) => {
  try {
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

    // Fetch all data in parallel
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
