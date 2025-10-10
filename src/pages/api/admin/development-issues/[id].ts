import type { APIRoute } from 'astro';
import { developmentIssueQueries } from 'src/lib/db/admin/development-issue-queries';

export const GET: APIRoute = async ({ params, locals }) => {
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

    const result = await developmentIssueQueries.getById(db, id);

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Development issue not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching development issue:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch development issue',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

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
    if (data.status && !['open', 'closed'].includes(data.status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status. Must be: open or closed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await developmentIssueQueries.update(db, id, {
      title: data.title,
      description: data.description,
      status: data.status,
      roadmap_stage_id: data.roadmap_stage_id,
    });

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'No fields to update or issue not found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating development issue:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update development issue',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
