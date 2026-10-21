import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Users, UserPlus, Trash2, Send, Activity, AlertTriangle, Bell, Share2 } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Family() {
  const { lang } = useLang();
  const kn = lang === 'kn';

  const [families, setFamilies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);
  const [healthData, setHealthData] = useState([]);
  const [familyAlerts, setFamilyAlerts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [tab, setTab] = useState('members'); // 'members' | 'health'
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [memberForm, setMemberForm] = useState({ member_name: '', phone: '', relation: '', user_id: null });
  const [reminderForm, setReminderForm] = useState({ member_name: '', phone: '', message: '' });
  const [alertMsg, setAlertMsg] = useState('');

  const relations = kn
    ? ['ಪತಿ/ಪತ್ನಿ', 'ಪೋಷಕ', 'ಮಗು', 'ಒಡಹುಟ್ಟಿದವರು', 'ಅಜ್ಜ/ಅಜ್ಜಿ', 'ಇತರ']
    : ['Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent', 'Other'];

  const fetchFamilies = () => api.get('/family').then(r => setFamilies(r.data));
  useEffect(() => { fetchFamilies(); }, []);

  const selectFamily = async (f) => {
    setSelected(f);
    setTab('members');
    const [mem, health, alr] = await Promise.all([
      api.get(`/family/${f.id}/members`),
      api.get(`/family/${f.id}/health`),
      api.get(`/family/${f.id}/alerts`),
    ]);
    setMembers(mem.data);
    setHealthData(health.data);
    setFamilyAlerts(alr.data);
  };

  const handleSearchUsers = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await api.get(`/family/search-users?query=${q}`);
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectSuggestedUser = (user) => {
    setMemberForm({
      member_name: user.name,
      phone: user.phone || '',
      relation: memberForm.relation,
      user_id: user.id
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const createFamily = async (e) => {
    e.preventDefault();
    await api.post('/family', { name: familyName });
    toast.success(kn ? 'ಕುಟುಂಬ ಗುಂಪು ರಚಿಸಲಾಗಿದೆ' : 'Family group created');
    setFamilyName(''); setShowFamilyForm(false); fetchFamilies();
  };

  const deleteFamily = async (id) => {
    if (!window.confirm(kn ? 'ಈ ಕುಟುಂಬ ಗುಂಪನ್ನು ಅಳಿಸಲು ಖಚಿತಪಡಿಸಿ?' : 'Delete this family group?')) return;
    await api.delete(`/family/${id}`);
    toast.success(kn ? 'ಕುಟುಂಬ ಗುಂಪು ಅಳಿಸಲಾಗಿದೆ' : 'Family group deleted');
    if (selected?.id === id) setSelected(null);
    fetchFamilies();
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/family/${selected.id}/members`, memberForm);
      toast.success(kn ? 'ಸದಸ್ಯರನ್ನು ಸೇರಿಸಲಾಗಿದೆ — WhatsApp ಅಧಿಸೂಚನೆ ಕಳುಹಿಸಲಾಗಿದೆ' : 'Member added — WhatsApp notification sent');
      setMemberForm({ member_name: '', phone: '', relation: '', user_id: null });
      setShowMemberForm(false);
      selectFamily(selected);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown network error';
      toast.error(`Failed: ${errMsg}`);
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm(kn ? 'ಈ ಸದಸ್ಯರನ್ನು ತೆಗೆದುಹಾಕಲು ಖಚಿತಪಡಿಸಿ?' : 'Remove this member?')) return;
    await api.delete(`/family/${selected.id}/members/${memberId}`);
    toast.success(kn ? 'ಸದಸ್ಯರನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ' : 'Member removed');
    selectFamily(selected);
  };

  const sendReminder = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/family/${selected.id}/remind`, reminderForm);
      toast.success(data.message);
      setReminderForm({ member_name: '', phone: '', message: '' });
      setShowReminderForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    }
  };

  const sendAlert = async () => {
    if (!alertMsg.trim()) return;
    try {
      const { data } = await api.post(`/family/${selected.id}/alert`, { alertMessage: alertMsg, severity: 'high' });
      toast.success(data.message);
      setAlertMsg('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send alert');
    }
  };

  // Pick member from list to pre-fill reminder form
  const pickMember = (m) => {
    setReminderForm({ member_name: m.member_name, phone: m.phone || '', message: '' });
    setShowReminderForm(true);
  };

  // Group health data by member for chart
  const memberNames = [...new Set(healthData.map(h => h.member_name))];
  const chartColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#7c3aed'];

  // Latest health per member
  const latestPerMember = memberNames.map(name => {
    const logs = healthData.filter(h => h.member_name === name);
    return { name, latest: logs[0] };
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>{kn ? 'ಕುಟುಂಬ ನಿರ್ವಹಣೆ' : 'Family Management'}</h2>
          <p>{kn ? 'ಕುಟುಂಬ ಆರೋಗ್ಯ ಗುಂಪುಗಳನ್ನು ರಚಿಸಿ, ಸದಸ್ಯರ ಆರೋಗ್ಯ ಡೇಟಾ ನೋಡಿ ಮತ್ತು ಜ್ಞಾಪನೆ ಕಳುಹಿಸಿ' : 'Create groups, view family health data, and send reminders to members'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowFamilyForm(!showFamilyForm)}>
          <Plus size={16} /> {kn ? 'ಹೊಸ ಕುಟುಂಬ ಗುಂಪು' : 'New Family Group'}
        </button>
      </div>

      {showFamilyForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={createFamily} style={{ display: 'flex', gap: 10 }}>
            <input className="form-input" placeholder={kn ? 'ಕುಟುಂಬ ಗುಂಪಿನ ಹೆಸರು' : 'Family group name (e.g. The Sharma Family)'} value={familyName} onChange={e => setFamilyName(e.target.value)} required style={{ flex: 1 }} />
            <button className="btn btn-primary" type="submit">{kn ? 'ರಚಿಸಿ' : 'Create'}</button>
            <button className="btn btn-secondary" type="button" onClick={() => setShowFamilyForm(false)}>{kn ? 'ರದ್ದು' : 'Cancel'}</button>
          </form>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left: Family list */}
        <div className="card">
          <div className="card-header"><div className="card-title">{kn ? 'ಕುಟುಂಬ ಗುಂಪುಗಳು' : 'Family Groups'}</div></div>
          {families.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👨‍👩‍👧</div><p>{kn ? 'ಇನ್ನೂ ಯಾವುದೇ ಕುಟುಂಬ ಗುಂಪುಗಳಿಲ್ಲ' : 'No family groups yet'}</p></div>
          ) : families.map(f => (
            <div key={f.id} style={{ padding: 14, borderRadius: 8, marginBottom: 8, background: selected?.id === f.id ? 'var(--primary-light)' : 'var(--bg)', border: `1px solid ${selected?.id === f.id ? 'var(--primary)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div onClick={() => selectFamily(f)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={18} /></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{kn ? 'ರಚಿಸಲಾಗಿದೆ' : 'Created'} {new Date(f.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => deleteFamily(f.id)} title={kn ? 'ಅಳಿಸಿ' : 'Delete'}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Right: Members / Health / Reminders */}
        <div>
          {!selected ? (
            <div className="card"><div className="empty-state"><div className="empty-icon">👈</div><p>{kn ? 'ಕುಟುಂಬ ಗುಂಪು ಆಯ್ಕೆ ಮಾಡಿ' : 'Select a family group'}</p></div></div>
          ) : (
            <>
              {/* Tab bar */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[
                  { key: 'members', label: kn ? 'ಸದಸ್ಯರು' : 'Members', icon: Users },
                  { key: 'health', label: kn ? 'ಆರೋಗ್ಯ ಡೇಟಾ' : 'Health Data', icon: Activity },
                  { key: 'remind', label: kn ? 'ಜ್ಞಾಪನೆ' : 'Reminders', icon: Bell },
                  { key: 'alert', label: kn ? 'ಎಚ್ಚರಿಕೆ' : 'Alert All', icon: AlertTriangle },
                ].map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}>
                    <t.icon size={13} /> {t.label}
                  </button>
                ))}
              </div>

              {/* Active Alerts Panel */}
              {familyAlerts.length > 0 && (
                <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {familyAlerts.map(a => (
                    <div 
                      key={a.id} 
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.08)', 
                        border: '1px solid rgba(239, 68, 68, 0.25)', 
                        borderLeft: '4px solid #ef4444', 
                        borderRadius: 8, 
                        padding: '10px 14px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        animation: 'pulseAlert 2s infinite ease-in-out'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                        <span style={{ fontSize: 13.5 }}>
                          🚨 <strong>{a.member_name}</strong>: {a.message}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Members tab */}
              {tab === 'members' && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">{selected.name} — {kn ? 'ಸದಸ್ಯರು' : 'Members'}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => {
                          const link = `${window.location.origin}/family/join/${selected.id}`;
                          navigator.clipboard.writeText(link);
                          toast.success(kn ? 'ಆಮಂತ್ರಣ ಕೊಂಡಿಯನ್ನು ಕ್ಲಿಪ್‌ಬೋರ್ಡ್‌ಗೆ ನಕಲಿಸಲಾಗಿದೆ!' : 'Invitation link copied to clipboard!');
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <Share2 size={13} /> {kn ? 'ಲಿಂಕ್ ಹಂಚಿಕೊಳ್ಳಿ' : 'Copy Link'}
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => setShowMemberForm(!showMemberForm)}>
                        <UserPlus size={14} /> {kn ? 'ಸೇರಿಸಿ' : 'Add'}
                      </button>
                    </div>
                  </div>

                  {showMemberForm && (
                    <form onSubmit={addMember} style={{ marginBottom: 16, padding: 14, background: 'var(--bg)', borderRadius: 8 }}>
                      <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 600 }}>🔍 {kn ? 'ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ಸದಸ್ಯರನ್ನು ಹುಡುಕಿ (ಹೆಸರು / ಫೋನ್)' : 'Search Existing Patients (Name / Phone)'}</label>
                        <input 
                          className="form-input" 
                          placeholder={kn ? 'ಹುಡುಕಲು ಟೈಪ್ ಮಾಡಿ...' : 'Type name or phone to search...'} 
                          value={searchQuery} 
                          onChange={e => handleSearchUsers(e.target.value)} 
                        />
                        {searchResults.length > 0 && (
                          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 6, marginTop: 4, maxHeight: 150, overflowY: 'auto', zIndex: 10, position: 'relative' }}>
                            {searchResults.map(u => (
                              <div 
                                key={u.id} 
                                onClick={() => selectSuggestedUser(u)} 
                                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                <span>👤 <strong>{u.name}</strong></span>
                                <span style={{ color: 'var(--text-muted)' }}>{u.phone || u.email}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">{kn ? 'ಹೆಸರು' : 'Name'}</label>
                          <input className="form-input" placeholder={kn ? 'ಸದಸ್ಯರ ಹೆಸರು' : 'Member name'} value={memberForm.member_name} onChange={e => setMemberForm({ ...memberForm, member_name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{kn ? 'ಫೋನ್' : 'Phone'}</label>
                          <input className="form-input" placeholder="+91 9876543210" value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">{kn ? 'ಸಂಬಂಧ' : 'Relation'}</label>
                        <select className="form-select" value={memberForm.relation} onChange={e => setMemberForm({ ...memberForm, relation: e.target.value })}>
                          <option value="">{kn ? 'ಆಯ್ಕೆ ಮಾಡಿ' : 'Select'}</option>
                          {relations.map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                        📱 {kn ? 'ಸದಸ್ಯರಿಗೆ WhatsApp ಅಧಿಸೂಚನೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ' : 'Member will receive a WhatsApp welcome notification'}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" type="submit">{kn ? 'ಸೇರಿಸಿ' : 'Add Member'}</button>
                        <button className="btn btn-secondary btn-sm" type="button" onClick={() => setShowMemberForm(false)}>{kn ? 'ರದ್ದು' : 'Cancel'}</button>
                      </div>
                    </form>
                  )}

                  {members.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">👤</div><p>{kn ? 'ಇನ್ನೂ ಯಾವುದೇ ಸದಸ್ಯರಿಲ್ಲ' : 'No members yet'}</p></div>
                  ) : members.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>
                        {m.member_name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{m.member_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {m.relation} · {m.phone || (kn ? 'ಫೋನ್ ಇಲ್ಲ' : 'No phone')}
                          {m.user_id && <span className="badge badge-green" style={{ marginLeft: 6 }}>{kn ? 'ಸಂಪರ್ಕಿತ' : 'Linked'}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {m.phone && (
                          <button className="btn btn-sm btn-success" onClick={() => pickMember(m)} title={kn ? 'ಜ್ಞಾಪನೆ ಕಳುಹಿಸಿ' : 'Send Reminder'}>
                            <Send size={13} />
                          </button>
                        )}
                        {!String(m.id).startsWith('creator') && (
                          <button className="btn btn-sm btn-danger" onClick={() => removeMember(m.id)} title={kn ? 'ತೆಗೆದುಹಾಕಿ' : 'Remove'}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Health Data tab */}
              {tab === 'health' && (
                <div>
                  {/* Latest per member */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                    {latestPerMember.map(({ name, latest }) => (
                      <div key={name} className="card" style={{ padding: 16 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>{name}</div>
                        {latest ? (
                          <>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{kn ? 'ಹೃದಯ ಬಡಿತ' : 'Heart Rate'}: <strong style={{ color: latest.heart_rate > 100 ? 'var(--danger)' : 'var(--text)' }}>{latest.heart_rate || '—'} bpm</strong></div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{kn ? 'ನಿದ್ರೆ' : 'Sleep'}: <strong>{latest.sleep_hours || '—'} hrs</strong></div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{kn ? 'ಹೆಜ್ಜೆ' : 'Steps'}: <strong>{latest.steps?.toLocaleString() || '—'}</strong></div>
                            <span className={`badge ${latest.health_score >= 75 ? 'badge-green' : latest.health_score >= 50 ? 'badge-yellow' : 'badge-red'}`}>
                              {kn ? 'ಸ್ಕೋರ್' : 'Score'}: {latest.health_score}/100
                            </span>
                          </>
                        ) : <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{kn ? 'ಡೇಟಾ ಇಲ್ಲ' : 'No data'}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Heart rate trend chart */}
                  {healthData.length > 0 && (
                    <div className="card">
                      <div className="card-header"><div className="card-title">{kn ? 'ಕುಟುಂಬ ಹೃದಯ ಬಡಿತ ಪ್ರವೃತ್ತಿ' : 'Family Heart Rate Trend'}</div></div>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={[...healthData].reverse().slice(-20)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="logged_at" tickFormatter={v => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} />
                          <Legend />
                          {memberNames.map((name, i) => (
                            <Line key={name} type="monotone" dataKey="heart_rate"
                              data={healthData.filter(h => h.member_name === name).reverse()}
                              stroke={chartColors[i % chartColors.length]} strokeWidth={2} dot={false} name={name} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Reminder tab */}
              {tab === 'remind' && (
                <div className="card">
                  <div className="card-header"><div className="card-title">{kn ? 'ಸದಸ್ಯರಿಗೆ ಜ್ಞಾಪನೆ ಕಳುಹಿಸಿ' : 'Send Reminder to Member'}</div></div>
                  <form onSubmit={sendReminder}>
                    <div className="form-group">
                      <label className="form-label">{kn ? 'ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ' : 'Select Member'}</label>
                      <select className="form-select" value={reminderForm.member_name}
                        onChange={e => {
                          const m = members.find(m => m.member_name === e.target.value);
                          setReminderForm({ ...reminderForm, member_name: e.target.value, phone: m?.phone || '' });
                        }}>
                        <option value="">{kn ? 'ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ' : 'Choose a member'}</option>
                        {members.filter(m => m.phone).map(m => (
                          <option key={m.id} value={m.member_name}>{m.member_name} ({m.phone})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{kn ? 'ಫೋನ್ ನಂಬರ್' : 'Phone Number'}</label>
                      <input className="form-input" placeholder="+91 9876543210" value={reminderForm.phone} onChange={e => setReminderForm({ ...reminderForm, phone: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{kn ? 'ಜ್ಞಾಪನೆ ಸಂದೇಶ' : 'Reminder Message'}</label>
                      <textarea className="form-textarea" rows={3}
                        placeholder={kn ? 'ಉದಾ: ನಿಮ್ಮ ಬೆಳಗಿನ ಔಷಧ ತೆಗೆದುಕೊಳ್ಳಲು ಮರೆಯಬೇಡಿ' : 'e.g. Please take your morning medication'}
                        value={reminderForm.message} onChange={e => setReminderForm({ ...reminderForm, message: e.target.value })} required />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={!reminderForm.phone || !reminderForm.message}>
                      <Send size={15} /> {kn ? 'WhatsApp ಜ್ಞಾಪನೆ ಕಳುಹಿಸಿ' : 'Send WhatsApp Reminder'}
                    </button>
                  </form>
                </div>
              )}

              {/* Alert All tab */}
              {tab === 'alert' && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">{kn ? 'ಎಲ್ಲ ಸದಸ್ಯರಿಗೆ ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಿ' : 'Alert All Family Members'}</div>
                  </div>
                  <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
                    🚨 {kn ? 'ಇದು ಎಲ್ಲ ಸದಸ್ಯರಿಗೆ WhatsApp ಮೂಲಕ ತುರ್ತು ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸುತ್ತದೆ' : 'This sends an emergency WhatsApp alert to all members with phone numbers'}
                  </div>
                  <div className="form-group">
                    <label className="form-label">{kn ? 'ಎಚ್ಚರಿಕೆ ಸಂದೇಶ' : 'Alert Message'}</label>
                    <textarea className="form-textarea" rows={4}
                      placeholder={kn ? 'ಉದಾ: ಅಜ್ಜಿಗೆ ಎದೆ ನೋವು ಇದೆ, ದಯವಿಟ್ಟು ತಕ್ಷಣ ಸಂಪರ್ಕಿಸಿ' : 'e.g. Grandma is having chest pain, please contact immediately'}
                      value={alertMsg} onChange={e => setAlertMsg(e.target.value)} />
                  </div>
                  <button className="btn btn-danger" onClick={sendAlert} disabled={!alertMsg.trim()} style={{ width: '100%', justifyContent: 'center' }}>
                    <AlertTriangle size={15} /> {kn ? 'ಎಲ್ಲರಿಗೂ ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಿ' : 'Send Alert to All Members'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
