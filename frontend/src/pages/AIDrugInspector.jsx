import { useState } from 'react';
import api from '../api/axios';
import { useLang } from '../context/LanguageContext';
import { ShieldAlert, AlertTriangle, ShieldCheck, Pill, Check, Sparkles, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseMarkdown } from '../utils/markdown';

export default function AIDrugInspector() {
  const { lang } = useLang();
  const kn = lang === 'kn';

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [meds, setMeds] = useState('');

  const runInspector = async (e) => {
    e.preventDefault();
    if (!meds.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ai/inspect-drugs', { medications: meds, lang });
      setResult(data.response);
      toast.success(kn ? 'ಔಷಧ ತಪಾಸಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ!' : 'Prescription scanned successfully!');
    } catch {
      toast.error(kn ? 'ತಪಾಸಣೆ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ' : 'Drug inspection failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (presetText) => {
    setMeds(presetText);
  };

  // Helper to parse markdown hazard levels
  const parseInspector = (text) => {
    if (!text) return { level: 'SAFE', details: [], schedule: [], flags: [] };
    const lines = text.split('\n');
    let level = 'SAFE';
    let currentSection = '';
    const details = [];
    const schedule = [];
    const flags = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (/^#+\s*Hazard Level/i.test(trimmed) || /^#+\s*ಅಪಾಯದ ಮಟ್ಟ/i.test(trimmed)) {
        currentSection = 'level';
        continue;
      } else if (/^#+\s*Interactions/i.test(trimmed) || /^#+\s*ಪರಸ್ಪರ ಪರಿಣಾಮಗಳು/i.test(trimmed)) {
        currentSection = 'interactions';
        continue;
      } else if (/^#+\s*Schedule/i.test(trimmed) || /^#+\s*ಸಮಯದ ಮಾರ್ಗಸೂಚಿ/i.test(trimmed)) {
        currentSection = 'schedule';
        continue;
      } else if (/^#+\s*Safety/i.test(trimmed) || /^#+\s*ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆ/i.test(trimmed)) {
        currentSection = 'safety';
        continue;
      }

      if (currentSection === 'level') {
        const upper = trimmed.toUpperCase();
        if (upper.includes('CRITICAL') || upper.includes('DANGER') || upper.includes('ಅಪಾಯ')) level = 'DANGER';
        else if (upper.includes('CAUTION') || upper.includes('WARNING') || upper.includes('ಎಚ್ಚರಿಕೆ')) level = 'WARNING';
        else if (upper.includes('SAFE') || upper.includes('ಸುರಕ್ಷಿತ')) level = 'SAFE';
      } else if (currentSection === 'interactions') {
        details.push(trimmed.replace(/^[-*•\d+.]\s*/, ''));
      } else if (currentSection === 'schedule') {
        schedule.push(trimmed.replace(/^[-*•\d+.]\s*/, ''));
      } else if (currentSection === 'safety') {
        flags.push(trimmed.replace(/^[-*•\d+.]\s*/, ''));
      }
    }

    return { level, details, schedule, flags };
  };

  const parsed = parseInspector(result);

  const getLevelStyles = (lvl) => {
    switch (lvl) {
      case 'DANGER':
        return {
          bg: 'rgba(239, 68, 68, 0.08)',
          border: 'rgba(239, 68, 68, 0.35)',
          color: '#ef4444',
          badgeClass: 'badge-red',
          text: kn ? '🚨 ತೀವ್ರ ಅಪಾಯ (CRITICAL DANGER)' : '🚨 CRITICAL DANGER DETECTED',
          icon: ShieldAlert,
        };
      case 'WARNING':
        return {
          bg: 'rgba(245, 158, 11, 0.08)',
          border: 'rgba(245, 158, 11, 0.35)',
          color: '#f59e0b',
          badgeClass: 'badge-yellow',
          text: kn ? '⚠️ ಜಾಗರೂಕತೆ ಅತ್ಯಗತ್ಯ (CAUTION REQUIRED)' : '⚠️ CAUTION ADVISED',
          icon: AlertTriangle,
        };
      case 'SAFE':
      default:
        return {
          bg: 'rgba(16, 185, 129, 0.08)',
          border: 'rgba(16, 185, 129, 0.35)',
          color: '#10b981',
          badgeClass: 'badge-green',
          text: kn ? '✅ ಸುರಕ್ಷಿತ (NO MAJOR DANGER)' : '✅ SAFE COMBINATION DETECTED',
          icon: ShieldCheck,
        };
    }
  };

  const lvlStyle = getLevelStyles(parsed.level);
  const LevelIcon = lvlStyle.icon;

  const presets = [
    {
      title: kn ? 'ಅಪಾಯಕಾರಿ ಮಿಕ್ಸ್' : 'High Risk Mix',
      meds: 'Aspirin, Ibuprofen, Warfarin (Blood thinner)',
      desc: kn ? 'ರಕ್ತಸ್ರಾವದ ಅಪಾಯ ಹೆಚ್ಚಿಸುತ್ತದೆ' : 'Checks for severe anti-platelet/bleeding risk'
    },
    {
      title: kn ? 'ಸಾಮಾನ್ಯ ಕಾಂಬಿನೇಷನ್' : 'Common Mix',
      meds: 'Amoxicillin (Antibiotic), Paracetamol, Cetirizine (Cold)',
      desc: kn ? 'ಜ್ವರ ಮತ್ತು ಸೋಂಕು ನಿಯಂತ್ರಕಗಳು' : 'Standard antibiotic/cold medication checklist'
    },
    {
      title: kn ? 'ಮಧುಮೇಹ + ಬಿಪಿ' : 'Diabetes + BP Mix',
      meds: 'Metformin, Lisinopril, Aspirin, Ibuprofen',
      desc: kn ? 'ಕಿಡ್ನಿ ಹಾನಿಯ ಅಪಾಯ ತಪಾಸಣೆ' : 'Checks NSAID interactions with BP inhibitors'
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>{kn ? 'Prescription Inspector' : 'Prescription Inspector & Drug Safety Engine'}</h2>
        <p>{kn ? 'ನೀವು ತೆಗೆದುಕೊಳ್ಳುವ ಔಷಧಿಗಳ ನಡುವಿನ ಪರಸ್ಪರ ಅಪಾಯಕಾರಿ ಪರಿಣಾಮಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ' : 'Scans multi-drug combinations to inspect for lethal drug-drug interactions, side effects, and schedule clashes'}</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Input Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pill size={22} color="var(--primary)" />
              {kn ? 'ಔಷಧಿಗಳ ಪಟ್ಟಿ ನಮೂದಿಸಿ' : 'Input Drug Inventory'}
            </h3>

            <form onSubmit={runInspector}>
              <div className="form-group">
                <label className="form-label">{kn ? 'ಪ್ರಸ್ತುತ ಔಷಧಿಗಳು (ಕಾಮಾದಿಂದ ಪ್ರತ್ಯೇಕಿಸಿ)' : 'Enter active medications (comma separated)'}</label>
                <textarea
                  className="form-input"
                  rows={6}
                  placeholder={kn
                    ? 'ಉದಾ: ಆಸ್ಪಿರಿನ್, ಮೆಟ್ಫಾರ್ಮಿನ್, ಇಬುಪ್ರೊಫೇನ್'
                    : 'e.g. Aspirin, Ibuprofen, Metformin 500mg, Lisinopril'}
                  value={meds}
                  onChange={e => setMeds(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || !meds.trim()}>
                {loading ? (
                  <>
                    <span className="spinner" style={{ marginRight: 6 }} />
                    {kn ? 'ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...' : 'Scanning Chemistry...'}
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    {kn ? 'ಔಷಧ ಸುರಕ್ಷತೆ ಪರಿಶೀಲಿಸಿ' : 'Inspect Medication Safety'}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Presets */}
          <div className="card">
            <h4 style={{ color: '#fff', fontSize: 14, marginBottom: 12 }}>{kn ? 'ತ್ವರಿತ ಪರೀಕ್ಷೆ ಪ್ರಿಸೆಟ್‌ಗಳು' : 'Quick Safety Test Cases'}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {presets.map(p => (
                <div
                  key={p.title}
                  onClick={() => loadPreset(p.meds)}
                  style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(255,255,255,0.01)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{p.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>{kn ? 'ಲೋಡ್ ಮಾಡಿ' : 'Load Preset'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{p.meds}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-light)', marginTop: 2 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div>
          {!result && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '52px 24px' }}>
              <div style={{ fontSize: 50, marginBottom: 12 }}>🛡️</div>
              <h4 style={{ color: '#fff', marginBottom: 6 }}>{kn ? 'ಸುರಕ್ಷತಾ ವರದಿ ಇಲ್ಲಿದೆ' : 'Pharmacology Audit Panel'}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280, margin: '0 auto' }}>
                {kn ? 'ಔಷಧಿಗಳನ್ನು ಬರೆದು "ಪರಿಶೀಲಿಸಿ" ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಪ್ರಿಸೆಟ್ ಲೋಡ್ ಮಾಡಿ.' : 'Load a test preset or enter your active prescription to query drug-drug interactions.'}
              </p>
            </div>
          )}

          {loading && (
            <div className="card" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <span className="spinner" style={{ width: 38, height: 38, borderWidth: 3 }} />
                <h4 style={{ color: '#fff', marginTop: 16 }}>{kn ? 'ಕೆಮಿಸ್ಟ್ರಿ ವಿಶ್ಲೇಷಣೆ ನಡೆಸಲಾಗುತ್ತಿದೆ...' : 'Running Pharmacology Inspection'}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{kn ? 'ಮಾದರಿಗಳನ್ನು ತಪಾಸಣೆ ಮಾಡಲಾಗುತ್ತಿದೆ' : 'Checking contraindications and side-effect correlations'}</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Hazard Banner */}
              <div className="card" style={{ background: lvlStyle.bg, borderColor: lvlStyle.border, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ color: lvlStyle.color }}>
                    <LevelIcon size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{lvlStyle.text}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{kn ? 'Llama 3.1 ಮಾನ್ಯತೆ ಪರಿಶೀಲನೆ' : 'Audited and verified via Clinical Llama AI model'}</div>
                  </div>
                </div>
              </div>

              {/* Interactions Card */}
              {parsed.details.length > 0 && (
                <div className="card">
                  <h4 style={{ color: '#fff', fontSize: 14, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                    {kn ? 'ಪರಸ್ಪರ ಪರಿಣಾಮಗಳು' : 'Drug-Drug Interference Findings'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {parsed.details.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 10, background: 'rgba(255,255,255,0.01)', borderRadius: 6 }}>
                        <ChevronRight size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                        <span style={{ fontSize: 13, lineHeight: 1.5 }}>{parseMarkdown(d)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule Card */}
              {parsed.schedule.length > 0 && (
                <div className="card">
                  <h4 style={{ color: '#fff', fontSize: 14, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                    {kn ? 'ಸಮಯ ಮತ್ತು ನಿಯಮಗಳು' : 'Optimal Dosing Schedule'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {parsed.schedule.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 10, background: 'rgba(255,255,255,0.01)', borderRadius: 6 }}>
                        <Check size={14} color="var(--secondary)" style={{ flexShrink: 0, marginTop: 3 }} />
                        <span style={{ fontSize: 13, lineHeight: 1.5 }}>{parseMarkdown(s)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Warning advisories */}
              {parsed.flags.length > 0 && (
                <div className="card" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ color: '#fff', fontSize: 14, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                    {kn ? 'ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆ ಮತ್ತು ಜಾಗರೂಕತೆ' : 'Pharmacological Safety Flags'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {parsed.flags.map((f, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        • {parseMarkdown(f)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 10, border: '1px solid var(--border)', fontSize: 11.5, color: 'var(--text-light)', textAlign: 'center' }}>
                {kn
                  ? 'ಎಚ್ಚರಿಕೆ: ಇದು ಕೇವಲ ಮಾಹಿತಿ ಒದಗಿಸುತ್ತದೆ. ಯಾವುದೇ ಹೊಸ ಔಷಧಿ ಪ್ರಾರಂಭಿಸುವ ಮುನ್ನ ನಿಮ್ಮ ವೈದ್ಯರ ಸಲಹೆ ಪಡೆಯಿರಿ.'
                  : 'IMPORTANT NOTE: This automated audit details chemical interactions but does not replace medical diagnostics. Consult a licensed pharmacist or physician before adjusting prescription logs.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
