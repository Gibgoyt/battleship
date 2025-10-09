import type { APIRoute } from 'astro';
import { projectStageQueries } from 'src/lib/db/admin/project-stage-queries';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const runtime = locals.runtime;
    const db = runtime?.env?.INTERNAL_OPS_ADMIN_DB;

    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const id = parseInt(params.id || '', 10);
    if (isNaN(id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await request.json();

    // Validate status if provided
    if (data.status) {
      const validStatuses = ['upcoming', 'current', 'completed', 'blocked'];
      if (!validStatuses.includes(data.status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status. Must be: upcoming, current, completed, or blocked' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const result = await projectStageQueries.update(db, id, {
      title: data.title,
      description: data.description,
      status: data.status,
      target_date: data.target_date,
      display_order: data.display_order,
    });

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'No fields to update or stage not found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating project stage:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update project stage',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
