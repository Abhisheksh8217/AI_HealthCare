import { useEffect, useState } from 'react';
import api from '../api/axios';
import { AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLang } from '../context/LanguageContext';

export default function Alerts() {
  const { t, lang } = useLang();
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = () => api.get('/health/alerts').then(r => setAlerts(r.data));
  useEffect(() => { fetchAlerts(); }, []);

  const markRead = async (id) => {
    await api.patch(`/health/alerts/${id}/read`);
    toast.success(lang === 'kn' ? 'ಓದಿದಂತೆ ಗುರುತಿಸಲಾಗಿದೆ' : 'Marked as read');
    fetchAlerts();
  };

  const unread = alerts.filter(a => !a.is_read);
  const read = alerts.filter(a => a.is_read);

  return (
    <div>
      <div className="page-header">
        <h2>{t('healthAlerts')}</h2>
        <p>{t('alertsSubtitle')}</p>
      </div>

      {alerts.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">✅</div><p>{t('noAlerts')}</p></div></div>
      ) : (
        <>
          {unread.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-title">{t('activeAlertsTitle')}</div>
                <span className="badge badge-red">{unread.length}</span>
              </div>
              {unread.map(a => (
                <div key={a.id} className={`alert-item ${a.severity === 'high' ? 'high' : 'unread'}`}>
                  <AlertCircle size={20} color={a.severity === 'high' ? '#ef4444' : '#f59e0b'} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{a.message}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(a.created_at).toLocaleString()} · <span className={`badge badge-${a.severity === 'high' ? 'red' : 'yellow'}`}>{a.severity}</span>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-success" onClick={() => markRead(a.id)}>
                    <CheckCircle size={14} /> {t('markRead')}
                  </button>
                </div>
              ))}
            </div>
          )}
          {read.length > 0 && (
            <div className="card">
              <div className="card-header"><div className="card-title">{t('resolvedAlerts')}</div></div>
              {read.map(a => (
                <div key={a.id} className="alert-item" style={{ opacity: 0.6 }}>
                  <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14 }}>{a.message}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
