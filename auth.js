import {
  getConfig,
  readResponse,
  invokeFunction,
  saveSupabaseSession,
  getSupabaseToken,
} from './supabase.js';
export async function login(display_name, password) {
  const config = await getConfig();
  if (config.backend === 'supabase') {
    const data = await invokeFunction('demo-login', { display_name, password });
    saveSupabaseSession(data.session);
    return data.profile;
  }
  return readResponse(
    await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name, password }),
    }),
  );
}
export async function getSession() {
  const config = await getConfig();
  if (config.backend === 'supabase') {
    const token = await getSupabaseToken();
    if (!token) return null;
    const userResponse = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${token}` },
    });
    if (!userResponse.ok) return null;
    const user = await userResponse.json();
    const profileResponse = await fetch(
      `${config.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=display_name`,
      { headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${token}` } },
    );
    const profiles = profileResponse.ok ? await profileResponse.json() : [];
    return {
      id: user.id,
      display_name: profiles[0]?.display_name || user.user_metadata?.display_name || 'Explorateur',
    };
  }
  const response = await fetch('/api/session', { cache: 'no-store' });
  if (response.status === 401) return null;
  return readResponse(response);
}
export async function logout() {
  const config = await getConfig();
  if (config.backend === 'supabase') {
    const token = await getSupabaseToken();
    if (token)
      await fetch(`${config.supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${token}` },
      });
    sessionStorage.removeItem('ia-supabase-session');
  } else await fetch('/api/logout', { method: 'POST' });
  sessionStorage.removeItem('ia-arrival');
  location.assign('login.html');
}
