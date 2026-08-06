import { useEffect } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from './store/settingsStore';
import { useCharacterStore } from './store/characterStore';
import { useCampaignStore } from './store/campaignStore';
import { useUiStore } from './store/uiStore';
import { useTheme } from './lib/useTheme';
import { useHeaderHidden } from './lib/useHeaderHidden';
import { useSendModeHotkey } from './lib/useSendModeHotkey';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { SendModeCursor } from './components/SendModeCursor';
import { CharacterList } from './components/CharacterList';
import { CharacterView } from './components/CharacterView';
import { CampaignList } from './components/CampaignList';
import { CampaignView } from './components/CampaignView';
import { Settings } from './components/Settings';
import { Info } from './components/Info';

export function App() {
  const { t } = useTranslation();
  const loadSettings = useSettingsStore((s) => s.load);
  const loadRoster = useCharacterStore((s) => s.loadRoster);
  const loadCampaignRoster = useCampaignStore((s) => s.loadRoster);
  useTheme();
  const headerHidden = useHeaderHidden();
  const editingActive = useUiStore((s) => s.editingActive);
  const sendModeActive = useUiStore((s) => s.sendModeActive);
  const sendModeViaHotkey = useUiStore((s) => s.sendModeViaHotkey);
  const setSendModeActive = useUiStore((s) => s.setSendModeActive);
  const setSendModeViaHotkey = useUiStore((s) => s.setSendModeViaHotkey);
  useSendModeHotkey();

  useEffect(() => {
    loadSettings();
    loadRoster();
    loadCampaignRoster();
  }, [loadSettings, loadRoster, loadCampaignRoster]);

  // Send mode is scoped to whatever sheet it was turned on for — leaving
  // the page (a different character/campaign, or a different section of
  // the app entirely) always turns it back off rather than silently
  // carrying it into a context the user never turned it on for.
  const { pathname } = useLocation();
  useEffect(() => {
    setSendModeActive(false);
    setSendModeViaHotkey(false);
  }, [pathname, setSendModeActive, setSendModeViaHotkey]);

  return (
    <div
      className={`app ${editingActive ? 'editing' : ''} ${sendModeActive && !sendModeViaHotkey ? 'send-mode' : ''}`}
    >
      <SendModeCursor />
      <header className={`app-header ${headerHidden ? 'hidden' : ''}`}>
        <NavLink to="/" className="brand">
          <span className="brand-mark">目</span>
          <span className="brand-text">
            <strong>{t('app.title')}</strong>
            <small>{t('app.tagline')}</small>
          </span>
        </NavLink>
        <nav className="app-nav">
          <NavLink to="/">{t('nav.characters')}</NavLink>
          <NavLink to="/gm">{t('nav.gm')}</NavLink>
          <NavLink to="/info">{t('nav.info')}</NavLink>
          <NavLink to="/settings">{t('nav.settings')}</NavLink>
          <LanguageSwitcher />
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<CharacterList />} />
          <Route path="/character/:id" element={<CharacterView />} />
          <Route path="/gm" element={<CampaignList />} />
          <Route path="/gm/:id" element={<CampaignView />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/info" element={<Info />} />
        </Routes>
      </main>
    </div>
  );
}
