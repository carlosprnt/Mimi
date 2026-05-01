// Supabase Edge Function: delete-account
//
// Authenticated endpoint. The mobile app invokes this via
// supabase.functions.invoke('delete-account') with the user's session
// token. Server-side we verify the token, then use the service-role
// key to permanently delete the auth user. All user-owned tables
// (profiles, babies, sleep_sessions, care_events, preferences) cascade
// via `on delete cascade` on user_id, so a single auth deletion wipes
// the user's data store-wide.
//
// Deploy with:
//   supabase functions deploy delete-account
//
// Required environment secrets (set with `supabase secrets set ...`):
//   SUPABASE_URL                 — auto-set by the Supabase platform
//   SUPABASE_ANON_KEY            — auto-set by the Supabase platform
//   SUPABASE_SERVICE_ROLE_KEY    — must be set explicitly for admin ops
//
// The deletion is App Store guideline 5.1.1(v) compliant: it removes
// every server-side trace of the user. The client also wipes local
// caches (AsyncStorage + widget App Group) after this returns ok.

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

(globalThis as any).Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401);
  }

  const supabaseUrl = (globalThis as any).Deno.env.get('SUPABASE_URL');
  const anonKey = (globalThis as any).Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = (globalThis as any).Deno.env.get(
    'SUPABASE_SERVICE_ROLE_KEY',
  );
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server is missing Supabase configuration' }, 500);
  }

  // Validate the caller using their bearer token. If this fails we
  // refuse the request — only a logged-in user can delete their own
  // account.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // Permanently delete the user with service-role privileges. The
  // foreign-key cascade on user_id handles the dependent rows.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: delError } = await adminClient.auth.admin.deleteUser(user.id);
  if (delError) {
    return json({ error: delError.message }, 500);
  }

  return json({ ok: true });
});
