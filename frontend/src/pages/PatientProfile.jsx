import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

export default function PatientProfile() {
  const { lang } = useLang();
  const [form, setForm] = useState({ age: '', gender: '', blood_group: '', address: '', medical_history: '', allergies: '', emergency_contact: '' });
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/patient').then(r => {
      setUser(r.data);
      setForm({ age: r.data.age || '', gender: r.data.gender || '', blood_group: r.data.blood_group || '', address: r.data.address || '', medical_history: r.data.medical_history || '', allergies: r.data.allergies || '', emergency_contact: r.data.emergency_contact || '' });
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/patient', form); toast.success(lang === 'kn' ? 'ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ' : 'Profile updated successfully'); }
    catch { toast.error(lang === 'kn' ? 'ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to update profile'); }
    finally { setLoading(false); }
  };

  const labels = {
    title: lang === 'kn' ? 'ರೋಗಿಯ ಪ್ರೊಫೈಲ್' : 'Patient Profile',
    subtitle: lang === 'kn' ? 'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮತ್ತು ವೈದ್ಯಕೀಯ ಮಾಹಿತಿ ನಿರ್ವಹಿಸಿ' : 'Manage your personal and medical information',
    personalInfo: lang === 'kn' ? 'ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ' : 'Personal Information',
    editProfile: lang === 'kn' ? 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ' : 'Edit Profile',
    age: lang === 'kn' ? 'ವಯಸ್ಸು' : 'Age',
    gender: lang === 'kn' ? 'ಲಿಂಗ' : 'Gender',
    bloodGroup: lang === 'kn' ? 'ರಕ್ತದ ಗುಂಪು' : 'Blood Group',
    emergency: lang === 'kn' ? 'ತುರ್ತು ಸಂಪರ್ಕ' : 'Emergency Contact',
    address: lang === 'kn' ? 'ವಿಳಾಸ' : 'Address',
    medHistory: lang === 'kn' ? 'ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ' : 'Medical History',
    allergies: lang === 'kn' ? 'ಅಲರ್ಜಿಗಳು' : 'Allergies',
    select: lang === 'kn' ? 'ಆಯ್ಕೆ ಮಾಡಿ' : 'Select',
    male: lang === 'kn' ? 'ಪುರುಷ' : 'Male',
    female: lang === 'kn' ? 'ಮಹಿಳೆ' : 'Female',
    other: lang === 'kn' ? 'ಇತರ' : 'Other',
    save: lang === 'kn' ? 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ' : 'Save Profile',
    saving: lang === 'kn' ? 'ಉಳಿಸುತ್ತಿದೆ...' : 'Saving...',
    years: lang === 'kn' ? 'ವರ್ಷ' : 'years',
  };

  return (
    <div>
      <div className="page-header"><h2>{labels.title}</h2><p>{labels.subtitle}</p></div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">{labels.personalInfo}</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>{user.name?.[0]?.toUpperCase()}</div>
            <div><div style={{ fontWeight: 600, fontSize: 18 }}>{user.name}</div><div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user.email}</div><div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user.phone}</div></div>
          </div>
          <div className="divider" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: labels.age, value: form.age ? `${form.age} ${labels.years}` : '—' },
              { label: labels.gender, value: form.gender || '—' },
              { label: labels.bloodGroup, value: form.blood_group || '—' },
              { label: labels.emergency, value: form.emergency_contact || '—' },
            ].map(item => (
              <div key={item.label} style={{ padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{item.value}</div>
              </div>
            ))}
          </div>
          {form.address && <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', borderRadius: 8 }}><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{labels.address}</div><div style={{ fontSize: 14 }}>{form.address}</div></div>}
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">{labels.editProfile}</div></div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">{labels.age}</label><input className="form-input" type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">{labels.gender}</label>
                <select className="form-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="">{labels.select}</option>
                  <option value="male">{labels.male}</option>
                  <option value="female">{labels.female}</option>
                  <option value="other">{labels.other}</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">{labels.bloodGroup}</label>
                <select className="form-select" value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })}>
                  <option value="">{labels.select}</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">{labels.emergency}</label><input className="form-input" placeholder="+91 9876543210" value={form.emergency_contact} onChange={e => setForm({ ...form, emergency_contact: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">{labels.address}</label><textarea className="form-textarea" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} /></div>
            <div className="form-group"><label className="form-label">{labels.medHistory}</label><textarea className="form-textarea" placeholder={lang === 'kn' ? 'ಮಧುಮೇಹ, ಅಧಿಕ ರಕ್ತದೊತ್ತಡ...' : 'Diabetes, Hypertension...'} value={form.medical_history} onChange={e => setForm({ ...form, medical_history: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">{labels.allergies}</label><textarea className="form-textarea" placeholder={lang === 'kn' ? 'ಪೆನಿಸಿಲಿನ್, ಕಡಲೆಕಾಯಿ...' : 'Penicillin, Peanuts...'} value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} rows={2} /></div>
            <button className="btn btn-primary" type="submit" disabled={loading}><Save size={16} /> {loading ? labels.saving : labels.save}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
