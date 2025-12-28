import type { APIRoute } from 'astro';
import { projectStageQueries } from 'src/lib/db/admin/project-stage-queries';

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

    const result = await projectStageQueries.getAllWithIssueCounts(db);

    return new Response(
      JSON.stringify({ success: true, data: result.results || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching project stages:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch project stages',
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
    if (!data.title || !data.status) {
      return new Response(
        JSON.stringify({ error: 'title and status are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate status
    const validStatuses = ['upcoming', 'current', 'completed', 'blocked'];
    if (!validStatuses.includes(data.status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status. Must be: upcoming, current, completed, or blocked' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get next display_order if not provided
    let display_order = data.display_order;
    if (display_order === undefined || display_order === null) {
      const nextOrder = await projectStageQueries.getNextDisplayOrder(db);
      display_order = nextOrder?.next_order || 1;
    }

    const result = await projectStageQueries.create(db, {
      title: data.title,
      description: data.description,
      status: data.status,
      target_date: data.target_date,
      display_order,
      created_by: data.created_by,
    });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating project stage:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create project stage',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
