import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('overons_theme');
    return saved !== 'light';
  });

  useEffect(() => {
    document.getElementById('app')?.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('overons_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button onClick={() => setDark(!dark)} className="theme-toggle"
      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text)' }}
      title={dark ? 'Modo claro' : 'Modo escuro'}>
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
