import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables.' });
  }

  const jwt = (req.headers.authorization || '').replace('Bearer ', '');
  if (!jwt) return res.status(401).json({ error: 'Missing login token.' });

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: userData, error: userError } = await adminClient.auth.getUser(jwt);
  if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid login token.' });

  const { data: profile } = await adminClient
    .from('admin_profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profile?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only super admin can create admin users.' });
  }

  const { email, password, role = 'admin', display_name = '' } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  if (!['admin', 'super_admin'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (createError) return res.status(400).json({ error: createError.message });

  const { error: upsertError } = await adminClient
    .from('admin_profiles')
    .upsert({ id: created.user.id, email, role, display_name }, { onConflict: 'id' });
  if (upsertError) return res.status(400).json({ error: upsertError.message });

  return res.status(200).json({ ok: true, user_id: created.user.id });
}
