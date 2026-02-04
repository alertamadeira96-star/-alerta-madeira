// Supabase Edge Function: send-notification
// This file should be deployed to Supabase Functions
// Location: supabase/functions/send-notification/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY') || '';
const FCM_URL = 'https://fcm.googleapis.com/fcm/send';

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Get authenticated user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { title, body } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all push tokens
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('push_tokens')
      .select('token, platform');

    if (tokensError || !tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No push tokens registered' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications via FCM
    let successCount = 0;
    let failureCount = 0;
    const invalidTokens: string[] = [];

    for (const tokenRow of tokens) {
      const fcmPayload = {
        to: tokenRow.token,
        notification: {
          title,
          body,
          sound: 'default',
        },
        data: {
          title,
          body,
        },
      };

      const fcmResponse = await fetch(FCM_URL, {
        method: 'POST',
        headers: {
          'Authorization': `key=${FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fcmPayload),
      });

      if (fcmResponse.ok) {
        const result = await fcmResponse.json();
        if (result.success === 1) {
          successCount++;
        } else {
          failureCount++;
          // Check if token is invalid
          if (result.results?.[0]?.error && 
              ['InvalidRegistration', 'NotRegistered'].includes(result.results[0].error)) {
            invalidTokens.push(tokenRow.token);
          }
        }
      } else {
        failureCount++;
      }
    }

    // Remove invalid tokens
    if (invalidTokens.length > 0) {
      await supabaseClient
        .from('push_tokens')
        .delete()
        .in('token', invalidTokens);
    }

    // Save notification history
    await supabaseClient
      .from('notifications')
      .insert({
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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
