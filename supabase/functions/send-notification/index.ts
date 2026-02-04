// Supabase Edge Function: send-notification
// Sends push notifications to Expo push tokens (Rork app) and optionally FCM (Flutter).
// Deploy: supabase functions deploy send-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const FCM_URL = 'https://fcm.googleapis.com/fcm/send';

function isExpoToken(token: string): boolean {
  return typeof token === 'string' && token.startsWith('ExponentPushToken[');
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    const authHeader = req.headers.get('Authorization');
    const jwt = authHeader?.replace('Bearer ', '') ?? '';
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    const {
      data: { user },
    } = await anonClient.auth.getUser(jwt);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await anonClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { title, body } = await req.json();
    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: tokens, error: tokensError } = await supabaseClient
      .from('push_tokens')
      .select('token, platform');

    if (tokensError || !tokens?.length) {
      await supabaseClient.from('notifications').insert({
        title,
        body,
        sent_by: user.id,
      });
      return new Response(
        JSON.stringify({
          success: true,
          sent: 0,
          failed: 0,
          total: 0,
          message: 'No push tokens registered',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const expoTokens = tokens.filter((r) => isExpoToken(r.token));
    const fcmTokens = tokens.filter((r) => !isExpoToken(r.token));

    let successCount = 0;
    let failureCount = 0;
    const invalidTokens: string[] = [];

    // Send to Expo push tokens (Rork / Expo app)
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
          if (r?.status === 'ok') {
            successCount++;
          } else {
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

    // Send to FCM tokens (e.g. Flutter app) if key is set
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
            if (err === 'InvalidRegistration' || err === 'NotRegistered') {
              invalidTokens.push(r.token);
            }
          }
        } else {
          failureCount++;
        }
      }
    } else if (fcmTokens.length > 0) {
      failureCount += fcmTokens.length;
    }

    if (invalidTokens.length > 0) {
      await supabaseAdmin
        .from('push_tokens')
        .delete()
        .in('token', invalidTokens);
    }

    await supabaseAdmin.from('notifications').insert({
      title,
      body,
      sent_by: user.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        total: tokens.length,
      }),
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
