import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { Menu } from 'lucide-react';

export default function Topbar({ onToggleSidebar }) {
  const location = useLocation();
  const { user } = useAuth();
  const { lang, switchLang, t } = useLang();

  const titles = {
    '/dashboard': t('dashboard'),
    '/profile': t('myProfile'),
    '/health': t('healthMonitor'),
    '/alerts': t('alerts'),
    '/appointments': t('appointments'),
    '/reminders': t('remindersTitle'),
    '/family': t('family'),
    '/symptoms': t('symptomChecker'),
    '/chatbot': t('healthChatbot'),
    '/doctor/profile': t('doctorProfile'),
    '/doctor/patients': t('patients'),
    '/ppg': t('ppgMonitor'),
  };

  const title = titles[location.pathname] || 'HealthCare';

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="topbar-title">{title}</div>
      </div>
      <div className="topbar-actions">
        <span className="topbar-welcome" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {t('welcomeBack')}, <strong>{user?.name?.split(' ')[0]}</strong>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16 }}>
          <button
            onClick={() => switchLang('en')}
            style={{
              padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)',
              background: lang === 'en' ? 'var(--primary)' : 'var(--bg)',
              color: lang === 'en' ? 'white' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
            }}
          >EN</button>
          <button
            onClick={() => switchLang('kn')}
            style={{
              padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)',
              background: lang === 'kn' ? 'var(--primary)' : 'var(--bg)',
              color: lang === 'kn' ? 'white' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: 'sans-serif'
            }}
          >ಕನ್ನಡ</button>
        </div>
      </div>
    </header>
  );
}
