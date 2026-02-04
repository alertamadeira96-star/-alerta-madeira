// Supabase Edge Function: notify-on-event
// Called when new posts (or other events) are created – sends push to all users.
// Trigger via Database Webhook on posts INSERT, or invoke with body { event, title, body }.
// Deploy: supabase functions deploy notify-on-event
// Set secret: supabase secrets set WEBHOOK_SECRET=your-secret

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const FCM_URL = 'https://fcm.googleapis.com/fcm/send';

function isExpoToken(token: string): boolean {
  return typeof token === 'string' && token.startsWith('ExponentPushToken[');
}

async function sendToAllTokens(
  supabase: ReturnType<typeof createClient>,
  title: string,
  body: string,
  sentBy: string | null
): Promise<{ sent: number; failed: number; total: number }> {
  const { data: tokens, error: tokensError } = await supabase
    .from('push_tokens')
    .select('token, platform');

  if (tokensError || !tokens?.length) {
    const insertPayload: { title: string; body: string; sent_by?: string } = { title, body };
    if (sentBy) insertPayload.sent_by = sentBy;
    await supabase.from('notifications').insert(insertPayload);
    return { sent: 0, failed: 0, total: 0 };
  }

  const expoTokens = tokens.filter((r) => isExpoToken(r.token));
  const fcmTokens = tokens.filter((r) => !isExpoToken(r.token));
  let successCount = 0;
  let failureCount = 0;
  const invalidTokens: string[] = [];

  if (expoTokens.length > 0) {
    const expoMessages = expoTokens.map((r) => ({
      to: r.token,
      title,
      body,
      sound: 'default' as const,
    }));
    const expoRes = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expoMessages),
    });
    if (expoRes.ok) {
      const expoData = await expoRes.json();
      const raw = expoData.data;
      const results = Array.isArray(raw) ? raw : raw ? [raw] : [];
      results.forEach((r: { status?: string; message?: string }, i: number) => {
        if (r?.status === 'ok') successCount++;
        else {
          failureCount++;
          if (r?.message?.toLowerCase().includes('invalid') || r?.message?.toLowerCase().includes('unregistered')) {
            invalidTokens.push(expoTokens[i]?.token ?? '');
          }
        }
      });
    } else {
      failureCount += expoTokens.length;
    }
  }

  const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY') ?? '';
  if (fcmTokens.length > 0 && FCM_SERVER_KEY) {
    for (const r of fcmTokens) {
      const fcmRes = await fetch(FCM_URL, {
        method: 'POST',
        headers: {
          Authorization: `key=${FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: r.token,
          notification: { title, body, sound: 'default' },
          data: { title, body },
        }),
      });
      if (fcmRes.ok) {
        const fcmData = await fcmRes.json();
        if (fcmData?.success === 1) successCount++;
        else {
          failureCount++;
          const err = fcmData?.results?.[0]?.error;
          if (err === 'InvalidRegistration' || err === 'NotRegistered') invalidTokens.push(r.token);
        }
      } else failureCount++;
    }
  } else if (fcmTokens.length > 0) {
    failureCount += fcmTokens.length;
  }

  if (invalidTokens.length > 0) {
    await supabase.from('push_tokens').delete().in('token', invalidTokens);
  }

  const insertPayload: { title: string; body: string; sent_by?: string } = { title, body };
  if (sentBy) insertPayload.sent_by = sentBy;
  await supabase.from('notifications').insert(insertPayload);

  return { sent: successCount, failed: failureCount, total: tokens.length };
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret, x-invoke-secret',
        },
      });
    }

    const body = await req.json().catch(() => ({}));
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET') ?? '';
    const headerSecret = req.headers.get('x-webhook-secret') ?? '';
    const authHeader = req.headers.get('Authorization') ?? '';
    const invokeSecret = Deno.env.get('INVOKE_SECRET') ?? 'test';
    const headerInvoke = req.headers.get('x-invoke-secret') ?? '';
    const isWebhook = webhookSecret && headerSecret === webhookSecret;
    const isTestInvoke = headerInvoke === invokeSecret && (body.event === 'new_post' || body.event === 'new_comment');
    const isAppTrigger = authHeader && (body.event === 'new_post' || body.event === 'new_comment');

    let sentBy: string | null = null;

    if (isWebhook) {
      // Database webhook – no user
    } else if (isTestInvoke) {
      // Manual test from dashboard (header x-invoke-secret)
    } else if (isAppTrigger) {
      const anon = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await anon.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      sentBy = user.id;
    } else if (webhookSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const record = body.record ?? body;
    const table = body.table ?? '';
    const type = body.type ?? body.event ?? '';

    let title = body.title ?? '';
    let bodyText = body.body ?? '';
    if (sentBy === null) sentBy = record?.user_id ?? body.sent_by ?? null;

    if (table === 'posts' && (type === 'INSERT' || type === 'new_post')) {
      const postTitle = record?.title ?? 'New post';
      const snippet = record?.description?.slice?.(0, 60) ?? '';
      title = title || 'Nova publicação';
      bodyText = bodyText || (snippet ? `${postTitle}: ${snippet}...` : postTitle);
    } else if (table === 'comments' && (type === 'INSERT' || type === 'new_comment')) {
      title = title || 'Novo comentário';
      bodyText = bodyText || 'Alguém comentou numa publicação.';
      sentBy = sentBy ?? record?.user_id ?? null;
    } else if (body.event === 'new_post' || body.event === 'new_comment') {
      title = body.title ?? title ?? 'Alerta Madeira';
      bodyText = body.body ?? bodyText ?? 'Atualização na aplicação.';
    }

    if (!title && !bodyText) {
      return new Response(
        JSON.stringify({ error: 'Missing title/body or unrecognized webhook payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const finalTitle = title || 'Alerta Madeira';
    const finalBody = bodyText || 'Nova atividade na aplicação.';

    const result = await sendToAllTokens(supabase, finalTitle, finalBody, sentBy);

    return new Response(
      JSON.stringify({ success: true, ...result }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message ?? 'Internal error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
