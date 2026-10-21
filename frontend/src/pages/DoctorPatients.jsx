import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Eye, FileText, X } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

export default function DoctorPatients() {
  const { t } = useLang();
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState(null);
  const [showRx, setShowRx] = useState(false);
  const [rx, setRx] = useState({ diagnosis: '', medications: '', instructions: '' });
  const [search, setSearch] = useState('');

  useEffect(() => { api.get('/doctor/patients').then(r => setPatients(r.data)); }, []);

  const viewPatient = async (p) => {
    setSelected(p);
    const { data } = await api.get(`/doctor/patients/${p.id}`);
    setRecords(data);
  };

  const writePrescription = async (e) => {
    e.preventDefault();
    await api.post('/doctor/prescriptions', { patient_id: selected.id, ...rx });
    toast.success('Prescription written');
    setShowRx(false);
    setRx({ diagnosis: '', medications: '', instructions: '' });
    viewPatient(selected);
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h2>{t('patients')}</h2>
        <p>{t('View and manage your patients health records')}</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Patient List</div></div>
          <input className="form-input" placeholder="Search patients..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
          {filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👤</div><p>No patients found</p></div>
          ) : filtered.map(p => (
            <div key={p.id}
              onClick={() => viewPatient(p)}
              style={{
                padding: '12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6,
                background: selected?.id === p.id ? 'var(--primary-light)' : 'var(--bg)',
                border: `1px solid ${selected?.id === p.id ? 'var(--primary)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', gap: 12
              }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                {p.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.age ? `${p.age} yrs` : ''} {p.gender || ''} {p.blood_group ? `· ${p.blood_group}` : ''}</div>
              </div>
              <Eye size={16} color="var(--text-muted)" />
            </div>
          ))}
        </div>

        <div>
          {!selected ? (
            <div className="card"><div className="empty-state"><div className="empty-icon">👈</div><p>Select a patient to view records</p></div></div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div>
                    <div className="card-title">{selected.name}</div>
                    <div className="card-subtitle">{selected.email} · {selected.phone}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowRx(!showRx)}>
                    <FileText size={14} /> Write Prescription
                  </button>
                </div>

                {records?.profile && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Age', value: records.profile.age },
                      { label: 'Gender', value: records.profile.gender },
                      { label: 'Blood Group', value: records.profile.blood_group },
                      { label: 'Emergency', value: records.profile.emergency_contact },
                    ].map(item => item.value && (
                      <div key={item.label} style={{ padding: 10, background: 'var(--bg)', borderRadius: 6 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {records?.profile?.medical_history && (
                  <div style={{ marginTop: 10, padding: 10, background: '#fef2f2', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Medical History</div>
                    <div style={{ fontSize: 13 }}>{records.profile.medical_history}</div>
                  </div>
                )}
              </div>

              {showRx && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <div className="card-title">New Prescription</div>
                    <button className="btn btn-icon btn-secondary" onClick={() => setShowRx(false)}><X size={16} /></button>
                  </div>
                  <form onSubmit={writePrescription}>
                    <div className="form-group">
                      <label className="form-label">Diagnosis</label>
                      <input className="form-input" value={rx.diagnosis} onChange={e => setRx({ ...rx, diagnosis: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Medications</label>
                      <textarea className="form-textarea" placeholder="Paracetamol 500mg - twice daily..." value={rx.medications} onChange={e => setRx({ ...rx, medications: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Instructions</label>
                      <textarea className="form-textarea" placeholder="Take after meals, rest well..." value={rx.instructions} onChange={e => setRx({ ...rx, instructions: e.target.value })} rows={2} />
                    </div>
                    <button className="btn btn-primary" type="submit">Save Prescription</button>
                  </form>
                </div>
              )}

              {records?.logs?.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header"><div className="card-title">Recent Health Logs</div></div>
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Date</th><th>HR</th><th>Steps</th><th>Sleep</th><th>Score</th></tr></thead>
                      <tbody>
                        {records.logs.map(l => (
                          <tr key={l.id}>
                            <td>{new Date(l.logged_at).toLocaleDateString()}</td>
                            <td>{l.heart_rate || '—'}</td>
                            <td>{l.steps?.toLocaleString() || '—'}</td>
                            <td>{l.sleep_hours || '—'}</td>
                            <td><span className={`badge ${l.health_score >= 75 ? 'badge-green' : l.health_score >= 50 ? 'badge-yellow' : 'badge-red'}`}>{l.health_score}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {records?.prescriptions?.length > 0 && (
                <div className="card">
                  <div className="card-header"><div className="card-title">Prescriptions</div></div>
                  {records.prescriptions.map(p => (
                    <div key={p.id} style={{ padding: 14, background: 'var(--bg)', borderRadius: 8, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{p.diagnosis}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                      {p.medications && <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Medications:</strong> {p.medications}</div>}
                      {p.instructions && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.instructions}</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
