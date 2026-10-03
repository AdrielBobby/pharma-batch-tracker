export const daysLeft = (date: string) => Math.ceil((new Date(date).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
export const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const body = await response.json().catch(() => ({ error: 'The server returned an invalid response' }));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
}
