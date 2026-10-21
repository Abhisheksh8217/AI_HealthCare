import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Pill } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

export default function Login() {
  const { t } = useLang();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('verified') === 'true') {
      toast.success('Email verified successfully! You can now log in.', { id: 'email-verified-success', duration: 5000 });
      navigate('/login', { replace: true });
    }
  }, [search, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`${t('welcomeBack')}, ${user.name}!`);
      
      const pendingJoin = localStorage.getItem('pendingJoinFamilyId');
      if (pendingJoin) {
        localStorage.removeItem('pendingJoinFamilyId');
        navigate(`/family/join/${pendingJoin}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(err.response?.data?.message || 'Email is not verified. Please check your inbox.', { duration: 6000 });
      } else {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon"><Pill size={22} /></div>
          <div>
            <h1>HealthCare</h1>
            <p>Management System</p>
          </div>
        </div>
        <h2 className="auth-title">{t('signIn')}</h2>
        <p className="auth-subtitle">{t('enterCredentials')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('emailAddress')}</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('password')}</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? <span className="spinner" /> : t('signInBtn')}
          </button>
        </form>

        <div className="auth-footer">
          {t('noAccount')} <Link to="/register">{t('createOne')}</Link>
        </div>
      </div>
    </div>
  );
}
