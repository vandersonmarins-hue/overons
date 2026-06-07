const BASE = import.meta.env.VITE_API_URL || '';

let _empresaId = '';

export function setEmpresaId(id) { _empresaId = id; }
export function getEmpresaId() { return _empresaId; }

export async function api(path) {
  const sep = path.includes('?') ? '&' : '?';
  const url = _empresaId ? `${BASE}${path}${sep}empresa_id=${_empresaId}` : `${BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}
