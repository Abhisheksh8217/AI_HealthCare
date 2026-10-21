import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { Plus, Video } from 'lucide-react';

export default function Appointments() {
  const { user } = useAuth();
  const { lang } = useLang();
  const kn = lang === 'kn';
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const fetchAppointments = () => api.get('/appointments').then(r => setAppointments(r.data));
  useEffect(() => { fetchAppointments(); if (user.role === 'patient') api.get('/doctor/all').then(r => setDoctors(r.data)); }, [user.role]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/appointments', form);
      toast.success(kn ? 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಲಾಗಿದೆ!' : 'Appointment booked!');
      setForm({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
      setShowForm(false); fetchAppointments();
    } catch { toast.error(kn ? 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to book appointment'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/appointments/${id}/status`, { status });
    toast.success(kn ? `ಸ್ಥಿತಿ ${status} ಗೆ ನವೀಕರಿಸಲಾಗಿದೆ` : `Status updated to ${status}`);
    fetchAppointments();
  };

  const statusColors = { scheduled: 'badge-blue', active: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red' };
  const statusLabels = kn
    ? { scheduled: 'ನಿಗದಿಪಡಿಸಲಾಗಿದೆ', active: 'ಸಕ್ರಿಯ', completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ', cancelled: 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ' }
    : { scheduled: 'scheduled', active: 'active', completed: 'completed', cancelled: 'cancelled' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>{kn ? 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ಗಳು' : 'Appointments'}</h2>
          <p>{user.role === 'doctor' ? (kn ? 'ನಿಮ್ಮ ರೋಗಿಗಳ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ಗಳನ್ನು ನಿರ್ವಹಿಸಿ' : 'Manage your patient appointments') : (kn ? 'ನಿಮ್ಮ ಸಮಾಲೋಚನೆಗಳನ್ನು ಬುಕ್ ಮಾಡಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ' : 'Book and manage your consultations')}</p>
        </div>
        {user.role === 'patient' && <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> {kn ? 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ' : 'Book Appointment'}</button>}
      </div>

      {showForm && user.role === 'patient' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div className="card-title">{kn ? 'ಹೊಸ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ' : 'Book New Appointment'}</div></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{kn ? 'ವೈದ್ಯರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ' : 'Select Doctor'}</label>
              <select className="form-select" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} required>
                <option value="">{kn ? 'ವೈದ್ಯರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ' : 'Choose a doctor'}</option>
                {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name} {d.specialization ? `— ${d.specialization}` : ''} {d.hospital ? `(${d.hospital})` : ''}</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{kn ? 'ದಿನಾಂಕ' : 'Date'}</label>
                <input className="form-input" type="date" value={form.appointment_date} min={new Date().toISOString().split('T')[0]} onChange={e => setForm({ ...form, appointment_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">{kn ? 'ಸಮಯ' : 'Time'}</label>
                <input className="form-input" type="time" value={form.appointment_time} onChange={e => setForm({ ...form, appointment_time: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{kn ? 'ಭೇಟಿಯ ಕಾರಣ' : 'Reason for Visit'}</label>
              <textarea className="form-textarea" placeholder={kn ? 'ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ...' : 'Describe your symptoms or reason...'} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? <span className="spinner" /> : (kn ? 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ' : 'Book Appointment')}</button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>{kn ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header"><div className="card-title">{kn ? 'ನನ್ನ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ಗಳು' : 'My Appointments'}</div></div>
        {appointments.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📅</div><p>{kn ? 'ಇನ್ನೂ ಯಾವುದೇ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ಗಳಿಲ್ಲ' : 'No appointments yet'}</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>{user.role === 'doctor' ? (kn ? 'ರೋಗಿ' : 'Patient') : (kn ? 'ವೈದ್ಯರು' : 'Doctor')}</th>
                <th>{kn ? 'ದಿನಾಂಕ' : 'Date'}</th><th>{kn ? 'ಸಮಯ' : 'Time'}</th>
                <th>{kn ? 'ಕಾರಣ' : 'Reason'}</th><th>{kn ? 'ಸ್ಥಿತಿ' : 'Status'}</th><th>{kn ? 'ಕ್ರಿಯೆ' : 'Actions'}</th>
              </tr></thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{user.role === 'doctor' ? a.patient_name : `Dr. ${a.doctor_name}`}</div>
                      {user.role === 'patient' && a.specialization && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.specialization}</div>}
                    </td>
                    <td>{new Date(a.appointment_date).toLocaleDateString(kn ? 'kn-IN' : 'en', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                    <td>{a.appointment_time}</td>
                    <td style={{ maxWidth: 200 }}><div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.reason || '—'}</div></td>
                    <td><span className={`badge ${statusColors[a.status]}`}>{statusLabels[a.status]}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {user.role === 'doctor' && a.status === 'scheduled' && <button className="btn btn-sm btn-success" onClick={() => updateStatus(a.id, 'active')}><Video size={13} /> {kn ? 'ಪ್ರಾರಂಭಿಸಿ' : 'Start'}</button>}
                        {a.status === 'active' && <button className="btn btn-sm btn-primary" onClick={() => updateStatus(a.id, 'completed')}>{kn ? 'ಪೂರ್ಣಗೊಳಿಸಿ' : 'Complete'}</button>}
                        {a.status === 'scheduled' && user.role === 'patient' && <button className="btn btn-sm btn-danger" onClick={() => updateStatus(a.id, 'cancelled')}>{kn ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}</button>}
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
