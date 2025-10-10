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

    const message_id = parseInt(params.messageId || '', 10);
    if (isNaN(message_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid message ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await productIssueQueries.getMessageById(db, message_id);

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching product issue message:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch message',
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

    const message_id = parseInt(params.messageId || '', 10);
    if (isNaN(message_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid message ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await request.json();

    if (!data.message_content) {
      return new Response(
        JSON.stringify({ error: 'message_content is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await productIssueQueries.updateMessage(db, message_id, data.message_content);

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating product issue message:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update message',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    const runtime = locals.runtime;
    const db = runtime?.env?.INTERNAL_OPS_ADMIN_DB;

    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const message_id = parseInt(params.messageId || '', 10);
    if (isNaN(message_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid message ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await request.json();

    if (!data.deleted_by) {
      return new Response(
        JSON.stringify({ error: 'deleted_by is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await productIssueQueries.softDeleteMessage(db, message_id, data.deleted_by);

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Message soft-deleted successfully', data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting product issue message:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to delete message',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
