import type { APIRoute } from 'astro';
import { developmentIssueQueries } from 'src/lib/db/admin/development-issue-queries';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = locals.runtime;
    const db = runtime?.env?.INTERNAL_OPS_ADMIN_DB;

    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await developmentIssueQueries.getAll(db);

    return new Response(
      JSON.stringify({ success: true, data: result.results || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching development issues:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch development issues',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

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
    if (!data.title || !data.roadmap_stage_id || !data.created_by) {
      return new Response(
        JSON.stringify({ error: 'title, roadmap_stage_id, and created_by are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate created_by exists in TeamMembers, use fallback if invalid
    let validatedCreatedBy = data.created_by;
    try {
      const teamMemberCheck = await db
        .prepare('SELECT id FROM TeamMembers WHERE id = ?')
        .bind(data.created_by)
        .first();

      if (!teamMemberCheck) {
        // created_by doesn't exist, get the first available team member
        const fallbackMember = await db
          .prepare('SELECT id FROM TeamMembers ORDER BY id LIMIT 1')
          .first<{ id: number }>();

        if (fallbackMember) {
          validatedCreatedBy = fallbackMember.id;
          console.warn(`Invalid created_by ${data.created_by}, using fallback: ${validatedCreatedBy}`);
        } else {
          return new Response(
            JSON.stringify({ error: 'No valid team members found in database' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (validationError) {
      console.error('Error validating created_by:', validationError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate team member' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await developmentIssueQueries.create(db, {
      roadmap_stage_id: data.roadmap_stage_id,
      title: data.title,
      description: data.description,
      created_by: validatedCreatedBy,
    });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating development issue:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create development issue',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
