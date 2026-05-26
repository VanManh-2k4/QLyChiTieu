export const THEME_STORAGE_KEY = 'app_theme';

export const APP_THEMES = [
  {
    id: 'indigo',
    name: 'Indigo',
    description: 'Sang trọng, chuyên nghiệp',
    colors: ['#4f46e5', '#7c3aed', '#f8fafc'],
    tokens: {
      '--app-bg': '#f5f7ff',
      '--app-surface': '#ffffff',
      '--app-surface-soft': '#f8faff',
      '--app-text': '#0f172a',
      '--app-text-muted': '#475569',
      '--app-border': '#dbe3f1',
      '--app-primary': '#4f46e5',
      '--app-primary-2': '#7c3aed',
      '--app-primary-contrast': '#ffffff',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Nhẹ mắt, dễ theo dõi số liệu',
    colors: ['#059669', '#0f766e', '#f0fdf4'],
    tokens: {
      '--app-bg': '#f2fbf8',
      '--app-surface': '#ffffff',
      '--app-surface-soft': '#ecfdf5',
      '--app-text': '#052e2b',
      '--app-text-muted': '#365b58',
      '--app-border': '#cae7de',
      '--app-primary': '#059669',
      '--app-primary-2': '#0f766e',
      '--app-primary-contrast': '#ffffff',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Nổi bật nhưng vẫn rõ ràng',
    colors: ['#ea580c', '#db2777', '#fff7ed'],
    tokens: {
      '--app-bg': '#fff7f1',
      '--app-surface': '#ffffff',
      '--app-surface-soft': '#fff1f2',
      '--app-text': '#3b1302',
      '--app-text-muted': '#7c2d12',
      '--app-border': '#f7d8c8',
      '--app-primary': '#ea580c',
      '--app-primary-2': '#db2777',
      '--app-primary-contrast': '#ffffff',
    },
  },
  {
    id: 'slate',
    name: 'Slate Dark',
    description: 'Tương phản cao, làm việc ban đêm',
    colors: ['#1e293b', '#334155', '#0f172a'],
    tokens: {
      '--app-bg': '#0b1220',
      '--app-surface': '#111a2e',
      '--app-surface-soft': '#18233d',
      '--app-text': '#e2e8f0',
      '--app-text-muted': '#94a3b8',
      '--app-border': '#24324d',
      '--app-primary': '#6366f1',
      '--app-primary-2': '#8b5cf6',
      '--app-primary-contrast': '#ffffff',
    },
  },
];

export function getThemeById(themeId) {
  return APP_THEMES.find((theme) => theme.id === themeId) || APP_THEMES[0];
}

export function getStoredThemeId() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return getThemeById(stored).id;
}

export function applyTheme(themeId) {
  const theme = getThemeById(themeId);
  const root = document.documentElement;
  root.setAttribute('data-app-theme', theme.id);
  Object.entries(theme.tokens).forEach(([token, value]) => {
    root.style.setProperty(token, value);
  });
  localStorage.setItem(THEME_STORAGE_KEY, theme.id);
}
