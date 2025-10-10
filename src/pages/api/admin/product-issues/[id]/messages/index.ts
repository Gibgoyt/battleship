import type { APIRoute } from 'astro';
import { productIssueQueries } from 'src/lib/db/admin/product-issue-queries';

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

    const issue_id = parseInt(params.id || '', 10);
    if (isNaN(issue_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid issue ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await productIssueQueries.getAllMessages(db, issue_id);

    return new Response(
      JSON.stringify({ success: true, data: result.results || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching product issue messages:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch messages',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const runtime = locals.runtime;
    const db = runtime?.env?.INTERNAL_OPS_ADMIN_DB;

    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const product_issue_id = parseInt(params.id || '', 10);
    if (isNaN(product_issue_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid issue ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.author_id || !data.message_content) {
      return new Response(
        JSON.stringify({ error: 'author_id and message_content are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await productIssueQueries.createMessage(db, {
      product_issue_id,
      author_id: data.author_id,
      message_content: data.message_content,
    });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating product issue message:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create message',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
