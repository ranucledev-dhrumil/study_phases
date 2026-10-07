import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AppSettings, Theme } from '../types';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const applyTheme = (t: Theme) => {
      let resolvedTheme = t;
      if (t === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    };

    const loadTheme = async () => {
      try {
        const settings = await invoke<AppSettings>('get_app_settings');
        setTheme(settings.theme);
        applyTheme(settings.theme);
      } catch (e) {
        console.error('Failed to load theme:', e);
      }
    };

    void loadTheme();

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      setTheme(prev => {
        if (prev === 'system') applyTheme('system');
        return prev;
      });
    };
    mq.addEventListener('change', handleSystemThemeChange);

    const handleSettingsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<AppSettings>;
      if (customEvent.detail && customEvent.detail.theme) {
        setTheme(customEvent.detail.theme);
        applyTheme(customEvent.detail.theme);
      }
    };
    window.addEventListener('settings-updated', handleSettingsUpdated);

    // If SettingsView didn't dispatch full AppSettings but just a simple reload,
    // we can reload here:
    const handleGenericSettingsUpdated = () => void loadTheme();
    window.addEventListener('settings-updated', handleGenericSettingsUpdated);

    return () => {
      mq.removeEventListener('change', handleSystemThemeChange);
      window.removeEventListener('settings-updated', handleSettingsUpdated);
      window.removeEventListener('settings-updated', handleGenericSettingsUpdated);
    };
  }, []);

  return { theme };
}
