import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Send } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

const PRESETS = {
  en: [
    { title: 'Morning Medication', description: 'Take prescribed morning medicines', reminder_type: 'medicine', reminder_time: '08:00' },
    { title: 'Evening Medication', description: 'Take prescribed evening medicines', reminder_type: 'medicine', reminder_time: '20:00' },
    { title: 'Annual Checkup', description: 'Schedule your annual health checkup', reminder_type: 'checkup', reminder_time: '10:00' },
    { title: 'Daily Walk', description: '30-minute walk for cardiovascular health', reminder_type: 'habit', reminder_time: '07:00' },
    { title: 'Drink Water', description: 'Stay hydrated — drink 8 glasses daily', reminder_type: 'habit', reminder_time: '09:00' },
  ],
  kn: [
    { title: 'ಬೆಳಗಿನ ಔಷಧ', description: 'ನಿಗದಿತ ಬೆಳಗಿನ ಔಷಧಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ', reminder_type: 'medicine', reminder_time: '08:00' },
    { title: 'ಸಂಜೆ ಔಷಧ', description: 'ನಿಗದಿತ ಸಂಜೆ ಔಷಧಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ', reminder_type: 'medicine', reminder_time: '20:00' },
    { title: 'ವಾರ್ಷಿಕ ತಪಾಸಣೆ', description: 'ನಿಮ್ಮ ವಾರ್ಷಿಕ ಆರೋಗ್ಯ ತಪಾಸಣೆ ನಿಗದಿಪಡಿಸಿ', reminder_type: 'checkup', reminder_time: '10:00' },
    { title: 'ದೈನಂದಿನ ನಡಿಗೆ', description: 'ಹೃದಯದ ಆರೋಗ್ಯಕ್ಕಾಗಿ 30 ನಿಮಿಷ ನಡಿಗೆ', reminder_type: 'habit', reminder_time: '07:00' },
    { title: 'ನೀರು ಕುಡಿಯಿರಿ', description: 'ಆರೋಗ್ಯಕರವಾಗಿರಿ — ದಿನಕ್ಕೆ 8 ಲೋಟ ನೀರು ಕುಡಿಯಿರಿ', reminder_type: 'habit', reminder_time: '09:00' },
  ],
};

export default function Reminders() {
  const { t, lang } = useLang();
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', reminder_type: 'medicine', reminder_time: '', frequency: 'daily', phone: '' });
  const [loading, setLoading] = useState(false);

  const fetchReminders = () => api.get('/reminders').then(r => setReminders(r.data));
  useEffect(() => { fetchReminders(); }, []);

  const normalizePhone = (p) => {
    const digits = p.replace(/[\s\-().+]/g, '');
    if (/^[6-9]\d{9}$/.test(digits)) return '+91' + digits;
    if (/^91[6-9]\d{9}$/.test(digits)) return '+' + digits;
    return p.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.phone && !/^\+\d{10,15}$/.test(normalizePhone(form.phone))) {
      toast.error('Enter a valid phone number e.g. 9876543210 or +91 9876543210');
      return;
    }
    setLoading(true);
    try {
      await api.post('/reminders', { ...form, phone: form.phone ? normalizePhone(form.phone) : '', lang });
      toast.success(lang === 'kn' ? 'ಜ್ಞಾಪನೆ ರಚಿಸಲಾಗಿದೆ!' : 'Reminder created!');
      setForm({ title: '', description: '', reminder_type: 'medicine', reminder_time: '', frequency: 'daily', phone: '' });
      setShowForm(false);
      fetchReminders();
    } catch {
      toast.error(lang === 'kn' ? 'ಜ್ಞಾಪನೆ ರಚಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/reminders/${id}`);
    toast.success(lang === 'kn' ? 'ಜ್ಞಾಪನೆ ಅಳಿಸಲಾಗಿದೆ' : 'Reminder deleted');
    fetchReminders();
  };

  const handleTrigger = async (id) => {
    try {
      await api.post(`/reminders/${id}/trigger`, { lang });
      toast.success(lang === 'kn' ? 'WhatsApp ಅಧಿಸೂಚನೆ ಕಳುಹಿಸಲಾಗಿದೆ!' : 'WhatsApp notification sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    }
  };

  const presets = PRESETS[lang] || PRESETS.en;

  const applyPreset = (preset) => {
    setForm({ ...form, ...preset });
    setShowForm(true);
  };

  const typeColors = { medicine: 'badge-blue', checkup: 'badge-green', habit: 'badge-purple', other: 'badge-gray' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>{t('remindersTitle')}</h2>
          <p>{t('remindersSubtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {t('addReminder')}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">{t('quickPresets')}</div></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {presets.map(p => (
            <button key={p.title} className="btn btn-secondary btn-sm" onClick={() => applyPreset(p)}>
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div className="card-title">{t('newReminder')}</div></div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{t('title')}</label>
                <input className="form-input" placeholder="Morning Medication" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('type')}</label>
                <select className="form-select" value={form.reminder_type} onChange={e => setForm({ ...form, reminder_type: e.target.value })}>
                  <option value="medicine">{t('medicine')}</option>
                  <option value="checkup">{t('checkup')}</option>
                  <option value="habit">{t('habit')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('time')}</label>
                <input className="form-input" type="time" value={form.reminder_time}
                  onChange={e => setForm({ ...form, reminder_time: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('frequency')}</label>
                <select className="form-select" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                  <option value="daily">{t('daily')}</option>
                  <option value="weekly">{t('weekly')}</option>
                  <option value="monthly">{t('monthly')}</option>
                  <option value="once">{t('once')}</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('description')}</label>
              <input className="form-input" placeholder="Additional notes..." value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('whatsappPhone')}</label>
              <input className="form-input" placeholder="9876543210 or +91 9876543210" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                📱 {lang === 'kn' ? 'ಸ್ಯಾಂಡ್‌ಬಾಕ್ಸ್‌ಗೆ ಸೇರಿದ ನಂಬರ್ ನಮೂದಿಸಿ • 10 ಅಂಕಿ ಅಥವಾ +91 ಸಹಿತ' : 'Enter the number that joined the sandbox • 10 digits or with +91'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : t('saveReminder')}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header"><div className="card-title">{t('myReminders')}</div></div>
        {reminders.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🔔</div><p>{t('noReminders')}</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('title')}</th><th>{t('type')}</th><th>{t('time')}</th>
                  <th>{t('frequency')}</th><th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.title}</div>
                      {r.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.description}</div>}
                      {r.phone && <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 2 }}>📱 {r.phone}</div>}
                    </td>
                    <td><span className={`badge ${typeColors[r.reminder_type]}`}>{r.reminder_type}</span></td>
                    <td>{r.reminder_time || '—'}</td>
                    <td>{r.frequency || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-success" onClick={() => handleTrigger(r.id)} title="Send WhatsApp now">
                          <Send size={13} />
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
