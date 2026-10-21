import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

export default function DoctorProfile() {
  const { t } = useLang();
  const [form, setForm] = useState({ specialization: '', license_number: '', hospital: '', experience: '', bio: '' });
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/doctor/profile').then(r => {
      setUser(r.data);
      setForm({
        specialization: r.data.specialization || '',
        license_number: r.data.license_number || '',
        hospital: r.data.hospital || '',
        experience: r.data.experience || '',
        bio: r.data.bio || '',
      });
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/doctor/profile', form);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>{t('doctorProfile')}</h2>
        <p>{t('Manage your professional information')}</p>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">Profile Overview</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 18 }}>Dr. {user.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user.email}</div>
              {form.specialization && <span className="badge badge-blue" style={{ marginTop: 4 }}>{form.specialization}</span>}
            </div>
          </div>
          <div className="divider" />
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { label: 'Hospital / Clinic', value: form.hospital },
              { label: 'License Number', value: form.license_number },
              { label: 'Experience', value: form.experience ? `${form.experience} years` : null },
            ].map(item => item.value && (
              <div key={item.label} style={{ padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{item.value}</div>
              </div>
            ))}
            {form.bio && (
              <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Bio</div>
                <div style={{ fontSize: 14 }}>{form.bio}</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Edit Profile</div></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input className="form-input" placeholder="Cardiology, General Medicine..." value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">License Number</label>
                <input className="form-input" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Experience (years)</label>
                <input className="form-input" type="number" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Hospital / Clinic</label>
              <input className="form-input" value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-textarea" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={4} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              <Save size={16} /> {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
