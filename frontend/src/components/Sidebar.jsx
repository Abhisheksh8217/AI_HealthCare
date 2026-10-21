import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import {
  LayoutDashboard, User, Heart, Users, Bell, AlertCircle,
  Stethoscope, Calendar, Bot, LogOut, Activity, Pill, Camera, FileSearch,
  Brain, ChefHat, ShieldAlert, FileText
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLang();

  const navConfig = {
    patient: [
      { section: 'Overview', items: [{ label: t('dashboard'), icon: LayoutDashboard, path: '/dashboard' }] },
      { section: 'Health', items: [
        { label: t('myProfile'), icon: User, path: '/profile' },
        { label: t('healthMonitor'), icon: Activity, path: '/health' },
        { label: t('ppgMonitor'), icon: Camera, path: '/ppg' },
        { label: t('alerts'), icon: AlertCircle, path: '/alerts' },
      ]},
      { section: 'Care', items: [
        { label: t('appointments'), icon: Calendar, path: '/appointments' },
        { label: t('reminders'), icon: Bell, path: '/reminders' },
        { label: t('family'), icon: Users, path: '/family' },
      ]},
      { section: t('aiSuiteTitle'), items: [
        { label: t('symptomChecker'), icon: Stethoscope, path: '/symptoms' },
        { label: t('healthChatbot'), icon: Bot, path: '/chatbot' },
        { label: lang === 'kn' ? 'AI ವರದಿ ವಿಶ್ಲೇಷಕ' : 'AI Report Analyser', icon: FileSearch, path: '/report-analyser' },
        { label: lang === 'kn' ? 'AI ವರದಿ ಸ್ಕ್ಯಾನರ್' : 'AI Report Scanner', icon: FileText, path: '/report-scanner' },
        { label: t('aiPredictor'), icon: Brain, path: '/ai-predictor' },
        { label: t('aiMealPlanner'), icon: ChefHat, path: '/ai-meal-planner' },
        { label: t('aiDrugInspector'), icon: ShieldAlert, path: '/ai-drug-inspector' },
      ]},
    ],
    doctor: [
      { section: 'Overview', items: [{ label: t('dashboard'), icon: LayoutDashboard, path: '/dashboard' }] },
      { section: 'Practice', items: [
        { label: t('doctorProfile'), icon: User, path: '/doctor/profile' },
        { label: t('patients'), icon: Heart, path: '/doctor/patients' },
        { label: t('appointments'), icon: Calendar, path: '/appointments' },
      ]},
    ],
    family: [
      { section: 'Overview', items: [{ label: t('dashboard'), icon: LayoutDashboard, path: '/dashboard' }] },
      { section: 'Family', items: [
        { label: t('family'), icon: Users, path: '/family' },
        { label: t('reminders'), icon: Bell, path: '/reminders' },
      ]},
    ],
  };

  const sections = navConfig[user?.role] || navConfig.patient;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon"><Pill size={18} /></div>
        <div>
          <h1>HealthCare</h1>
          <span>Management System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div className="nav-section" key={section.section}>
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <button
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="user-info">
            <div className="name">{user?.name}</div>
            <div className="role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
