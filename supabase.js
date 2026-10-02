let configuration;
export async function getConfig() {
  if (!configuration)
    configuration = (async () => {
      const publicConfig = window.IA_CONFIG || {};
      if (publicConfig.supabaseUrl && publicConfig.supabaseAnonKey)
        return { ...publicConfig, backend: 'supabase' };
      const response = await fetch('/api/config', { cache: 'no-store' });
      if (!response.ok)
        throw new Error(
          'Lancez le projet avec npm start, ou configurez Supabase pour un hébergement statique.',
        );
      return { ...publicConfig, ...(await response.json()) };
    })();
  return configuration;
}
export async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Le laboratoire est momentanément indisponible. Réessayez.');
    error.status = response.status;
    throw error;
  }
  return data;
}
export function saveSupabaseSession(session) {
  sessionStorage.setItem(
    'ia-supabase-session',
    JSON.stringify({
      ...session,
      expires_at: session.expires_at || Math.floor(Date.now() / 1000) + session.expires_in,
    }),
  );
}
export async function getSupabaseToken() {
  let session;
  try {
    session = JSON.parse(sessionStorage.getItem('ia-supabase-session') || 'null');
  } catch {
    sessionStorage.removeItem('ia-supabase-session');
  }
  if (!session?.access_token) return null;
  if (session.expires_at < Date.now() / 1000 + 60) {
    const config = await getConfig();
    const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!response.ok) {
      sessionStorage.removeItem('ia-supabase-session');
      return null;
    }
    session = await response.json();
    saveSupabaseSession(session);
  }
  return session.access_token;
}
export async function invokeFunction(name, body, signal) {
  const config = await getConfig();
  const token = name === 'demo-login' ? null : await getSupabaseToken();
  if (name !== 'demo-login' && !token) {
    const err = new Error('Votre session a expiré. Reconnectez-vous.');
    err.status = 401;
    throw err;
  }
  return readResponse(
    await fetch(`${config.supabaseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        apikey: config.supabaseAnonKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    }),
  );
}
