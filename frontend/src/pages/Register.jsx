import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Pill } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

const roles = [
  { value: 'patient', label: 'Patient', icon: '🧑‍⚕️' },
  { value: 'doctor', label: 'Doctor', icon: '👨‍⚕️' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧' },
];

export default function Register() {
  const { t } = useLang();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'patient', passcode: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await register(form);
      toast.success(res.message || 'Registration successful! Please check your email to verify your account.', { duration: 6000 });
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
        <h2 className="auth-title">{t('createAccount')}</h2>
        <p className="auth-subtitle">{t('chooseRole')}</p>

        <div className="role-selector">
          {roles.map(r => (
            <div
              key={r.value}
              className={`role-option ${form.role === r.value ? 'selected' : ''}`}
              onClick={() => setForm({ ...form, role: r.value })}
            >
              <div className="role-icon">{r.icon}</div>
              {r.label}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t('fullName')}</label>
              <input className="form-input" placeholder="John Doe" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('phone')}</label>
              <input className="form-input" placeholder="+91 9876543210" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('emailAddress')}</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">{t('password')}</label>
            <input className="form-input" type="password" placeholder="Min. 8 characters" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          {form.role === 'doctor' && (
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--secondary)' }}>Doctor Verification Passcode 🔑</label>
              <input className="form-input" type="password" placeholder="Enter secure doctor passcode" value={form.passcode}
                onChange={e => setForm({ ...form, passcode: e.target.value })} required />
            </div>
          )}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? <span className="spinner" /> : t('createAccount')}
          </button>
        </form>

        <div className="auth-footer">
          {t('alreadyHave')} <Link to="/login">{t('signIn')}</Link>
        </div>
      </div>
    </div>
  );
}
