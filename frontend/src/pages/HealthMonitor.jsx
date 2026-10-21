import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function HealthMonitor() {
  const { t, lang } = useLang();
  const [form, setForm] = useState({ heart_rate: '', steps: '', sleep_hours: '', weight: '', blood_pressure: '', notes: '' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchHistory = () => api.get('/health/history').then(r => setHistory(r.data));
  useEffect(() => { fetchHistory(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await api.post('/health/log', form);
      toast.success(lang === 'kn' ? `ದಾಖಲಿಸಲಾಗಿದೆ! ಆರೋಗ್ಯ ಸ್ಕೋರ್: ${data.health_score}/100` : `Logged! Health Score: ${data.health_score}/100`);
      if (data.alerts?.length) data.alerts.forEach(a => toast.error(a.msg, { icon: '⚠️' }));
      setForm({ heart_rate: '', steps: '', sleep_hours: '', weight: '', blood_pressure: '', notes: '' });
      setShowForm(false); fetchHistory();
    } catch { toast.error(lang === 'kn' ? 'ಆರೋಗ್ಯ ಡೇಟಾ ದಾಖಲಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to log health data'); }
    finally { setLoading(false); }
  };

  const chartData = [...history].reverse().slice(-14);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h2>{t('healthMonitor')}</h2><p>{t('trackMetrics')}</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> {t('logHealthData')}</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div className="card-title">{t('logTodayData')}</div></div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-3">
              {[
                { key: 'heart_rate', label: lang === 'kn' ? 'ಹೃದಯ ಬಡಿತ (bpm)' : 'Heart Rate (bpm)', placeholder: '72', type: 'number' },
                { key: 'steps', label: t('steps'), placeholder: '8000', type: 'number' },
                { key: 'sleep_hours', label: t('sleepHoursLabel'), placeholder: '7.5', type: 'number', step: '0.5' },
                { key: 'weight', label: t('weight'), placeholder: '70', type: 'number', step: '0.1' },
                { key: 'blood_pressure', label: t('bloodPressure'), placeholder: '120/80' },
                { key: 'notes', label: t('notes'), placeholder: lang === 'kn' ? 'ಚೆನ್ನಾಗಿ ಅನಿಸುತ್ತಿದೆ...' : 'Feeling good...' },
              ].map(f => (
                <div className="form-group" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" type={f.type || 'text'} step={f.step} placeholder={f.placeholder}
                    value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? <span className="spinner" /> : t('saveEntry')}</button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div className="card-title">{t('healthTrends')}</div></div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="logged_at" tickFormatter={v => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} />
              <Legend />
              <Line type="monotone" dataKey="heart_rate" stroke="#ef4444" strokeWidth={2} dot={false} name={lang === 'kn' ? 'ಹೃದಯ ಬಡಿತ' : 'Heart Rate'} />
              <Line type="monotone" dataKey="sleep_hours" stroke="#2563eb" strokeWidth={2} dot={false} name={lang === 'kn' ? 'ನಿದ್ರೆ ಗಂಟೆ' : 'Sleep Hrs'} />
              <Line type="monotone" dataKey="health_score" stroke="#10b981" strokeWidth={2} dot={false} name={lang === 'kn' ? 'ಆರೋಗ್ಯ ಸ್ಕೋರ್' : 'Health Score'} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <div className="card-header"><div className="card-title">{t('healthHistory')}</div></div>
        {history.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📊</div><p>{t('noHealthData')}</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>{t('date')}</th>
                <th>{lang === 'kn' ? 'ಹೃದಯ ಬಡಿತ' : 'Heart Rate'}</th>
                <th>{t('steps')}</th>
                <th>{lang === 'kn' ? 'ನಿದ್ರೆ' : 'Sleep'}</th>
                <th>{lang === 'kn' ? 'ತೂಕ' : 'Weight'}</th>
                <th>BP</th>
                <th>{t('score')}</th>
              </tr></thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td>{new Date(h.logged_at).toLocaleDateString()}</td>
                    <td><span style={{ color: h.heart_rate > 100 ? 'var(--danger)' : 'inherit' }}>{h.heart_rate || '—'} {h.heart_rate ? 'bpm' : ''}</span></td>
                    <td>{h.steps?.toLocaleString() || '—'}</td>
                    <td><span style={{ color: h.sleep_hours < 5 ? 'var(--warning)' : 'inherit' }}>{h.sleep_hours || '—'} {h.sleep_hours ? (lang === 'kn' ? 'ಗಂ' : 'hrs') : ''}</span></td>
                    <td>{h.weight ? `${h.weight} kg` : '—'}</td>
                    <td>{h.blood_pressure || '—'}</td>
                    <td><span className={`badge ${h.health_score >= 75 ? 'badge-green' : h.health_score >= 50 ? 'badge-yellow' : 'badge-red'}`}>{h.health_score}/100</span></td>
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
