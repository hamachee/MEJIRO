import { useEffect } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from './store/settingsStore';
import { useCharacterStore } from './store/characterStore';
import { useTheme } from './lib/useTheme';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ThemeToggle } from './components/ThemeToggle';
import { CharacterList } from './components/CharacterList';
import { CharacterView } from './components/CharacterView';
import { Settings } from './components/Settings';

export function App() {
  const { t } = useTranslation();
  const loadSettings = useSettingsStore((s) => s.load);
  const loadRoster = useCharacterStore((s) => s.loadRoster);
  useTheme();

  useEffect(() => {
    loadSettings();
    loadRoster();
  }, [loadSettings, loadRoster]);

  return (
    <div className="app">
      <header className="app-header">
        <NavLink to="/" className="brand">
          <span className="brand-mark">目</span>
          <span className="brand-text">
            <strong>{t('app.title')}</strong>
            <small>{t('app.tagline')}</small>
          </span>
        </NavLink>
        <nav className="app-nav">
          <NavLink to="/">{t('nav.characters')}</NavLink>
          <NavLink to="/settings">{t('nav.settings')}</NavLink>
          <ThemeToggle />
          <LanguageSwitcher />
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<CharacterList />} />
          <Route path="/character/:id" element={<CharacterView />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
