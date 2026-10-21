import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Search, AlertTriangle } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { parseMarkdown } from '../utils/markdown';

export default function SymptomChecker() {
  const { lang } = useLang();
  const kn = lang === 'kn';

  const SYMPTOMS_EN = ['Fever', 'Cough', 'Headache', 'Fatigue', 'Body Pain', 'Nausea', 'Chest Pain', 'Breathlessness'];
  const SYMPTOMS_KN = ['ಜ್ವರ', 'ಕೆಮ್ಮು', 'ತಲೆನೋವು', 'ಆಯಾಸ', 'ಮೈಕೈ ನೋವು', 'ವಾಕರಿಕೆ', 'ಎದೆ ನೋವು', 'ಉಸಿರಾಟದ ತೊಂದರೆ'];
  const SYMPTOMS = kn ? SYMPTOMS_KN : SYMPTOMS_EN;

  const [selected, setSelected] = useState([]);
  const [custom, setCustom] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggle = (s) => setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const check = async () => {
    const symptoms = [...selected, custom].filter(Boolean).join(', ');
    if (!symptoms) return toast.error(kn ? 'ದಯವಿಟ್ಟು ರೋಗಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ' : 'Please select or enter symptoms');
    setLoading(true); setResult(null);
    try {
      const { data } = await api.post('/ai/symptoms', { symptoms, lang });
      setResult(data);
    } catch { toast.error(kn ? 'ರೋಗಲಕ್ಷಣ ವಿಶ್ಲೇಷಣೆ ವಿಫಲವಾಗಿದೆ' : 'Failed to analyze symptoms'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>{kn ? 'ರೋಗಲಕ್ಷಣ ಪರೀಕ್ಷಕ' : 'Symptom Checker'}</h2>
        <p>{kn ? 'AI ಆಧಾರಿತ ರೋಗಲಕ್ಷಣ ವಿಶ್ಲೇಷಣೆ — ವೃತ್ತಿಪರ ವೈದ್ಯಕೀಯ ಸಲಹೆಗೆ ಬದಲಿಯಲ್ಲ' : 'AI-powered symptom analysis — not a substitute for professional medical advice'}</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">{kn ? 'ರೋಗಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ' : 'Select Symptoms'}</div></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {SYMPTOMS.map(s => (
              <button key={s} onClick={() => toggle(s)} className={`btn btn-sm ${selected.includes(s) ? 'btn-primary' : 'btn-secondary'}`}>{s}</button>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">{kn ? 'ಹೆಚ್ಚುವರಿ ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ' : 'Describe additional symptoms'}</label>
            <textarea className="form-textarea" placeholder={kn ? 'ಉದಾ: ಗಂಟಲು ನೋವು, ಮೂಗು ಸೋರುವಿಕೆ...' : 'e.g. sore throat, runny nose, dizziness...'}
              value={custom} onChange={e => setCustom(e.target.value)} rows={3} />
          </div>
          <button className="btn btn-primary" onClick={check} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <><span className="spinner" /> {kn ? 'ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...' : 'Analyzing...'}</> : <><Search size={16} /> {kn ? 'ರೋಗಲಕ್ಷಣ ವಿಶ್ಲೇಷಿಸಿ' : 'Analyze Symptoms'}</>}
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">{kn ? 'ವಿಶ್ಲೇಷಣೆ ಫಲಿತಾಂಶ' : 'Analysis Result'}</div>
            {result?.source && <span className={`badge ${result.source === 'groq' ? 'badge-blue' : 'badge-yellow'}`}>{result.source === 'groq' ? '🤖 AI' : '📋 Offline'}</span>}
          </div>

          {!result && !loading && <div className="empty-state"><div className="empty-icon">🩺</div><p>{kn ? 'ರೋಗಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಮತ್ತು ವಿಶ್ಲೇಷಿಸಿ ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Select symptoms and click Analyze'}</p></div>}

          {loading && <div className="loading-page"><div style={{ textAlign: 'center' }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /><p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 14 }}>{kn ? 'ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...' : 'Analyzing your symptoms...'}</p></div></div>}

          {result && (
            <>
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{parseMarkdown(result.response)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: '#92400e' }}>
                  {kn ? 'ಇದು ಮಾಹಿತಿ ಉದ್ದೇಶಕ್ಕಾಗಿ ಮಾತ್ರ. ವೈದ್ಯಕೀಯ ಸಲಹೆಗಾಗಿ ಯಾವಾಗಲೂ ಅರ್ಹ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರನ್ನು ಸಂಪರ್ಕಿಸಿ.' : 'This is for informational purposes only. Always consult a qualified healthcare professional for medical advice.'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
