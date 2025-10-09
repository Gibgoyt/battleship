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

    const result = await developmentIssueQueries.create(db, {
      roadmap_stage_id: data.roadmap_stage_id,
      title: data.title,
      description: data.description,
      created_by: data.created_by,
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
