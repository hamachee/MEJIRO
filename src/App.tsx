import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from './store/settingsStore';
import { useCharacterStore } from './store/characterStore';
import { useCampaignStore } from './store/campaignStore';
import { useUiStore } from './store/uiStore';
import { getDB } from './storage/db';
import { useTheme } from './lib/useTheme';
import { useHeaderHidden } from './lib/useHeaderHidden';
import { useSendModeHotkey } from './lib/useSendModeHotkey';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { SendModeCursor } from './components/SendModeCursor';
import { IconGear, IconGearFill, IconQuestion } from './components/icons';
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

  // Portable builds can end up opened out of order (an older MEJIRO.html
  // reopened after a newer one already bumped the on-disk schema in this
  // same browser) — IndexedDB refuses to open at a lower version than what
  // it already has, rejecting with VersionError instead of the usual
  // upgrade path. Caught here, once, before the normal load calls (which
  // would otherwise fail the same way but silently, leaving the app just
  // looking empty) so there's a real explanation instead.
  const [outdatedBuild, setOutdatedBuild] = useState(false);
  useEffect(() => {
    getDB()
      .then(() => {
        loadSettings();
        loadRoster();
        loadCampaignRoster();
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'VersionError') {
          setOutdatedBuild(true);
        } else {
          throw err;
        }
      });
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

  if (outdatedBuild) {
    return (
      <div className="app">
        <main className="app-main">
          <section className="card outdated-build">
            <h1>{t('app.outdatedTitle')}</h1>
            <p>{t('app.outdatedBody')}</p>
          </section>
        </main>
      </div>
    );
  }

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
          <NavLink to="/info" className="icon-link" aria-label={t('nav.info')} title={t('nav.info')}>
            <IconQuestion />
          </NavLink>
          <NavLink
            to="/settings"
            className="icon-link"
            aria-label={t('nav.settings')}
            title={t('nav.settings')}
          >
            {({ isActive }) => (isActive ? <IconGearFill /> : <IconGear />)}
          </NavLink>
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
