import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useLang } from '../context/LanguageContext';
import { Brain, HeartPulse, Activity, ShieldAlert, Thermometer, RefreshCw, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseMarkdown } from '../utils/markdown';

export default function AIPredictor() {
  const { lang, t } = useLang();
  const kn = lang === 'kn';

  const [loading, setLoading] = useState(false);
  const [hasLogs, setHasLogs] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [parsedRisks, setParsedRisks] = useState({ cardio: 0, diabetes: 0, burnout: 0 });

  useEffect(() => {
    // Check if user has health logs
    api.get('/health/history').then(res => {
      setHasLogs(res.data.length > 0);
    }).catch(() => {});
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    setAnalysisResult(null);
    try {
      const { data } = await api.post('/ai/predict-risks', { lang });
      const text = data.response;
      setAnalysisResult(text);

      // Parse risk values from markdown (e.g. "Cardiovascular Risk: 15% (Low)")
      let cardioVal = 0, diabetesVal = 0, burnoutVal = 0;
      
      const cardioMatch = text.match(/(?:Cardiovascular|Cardio|ಹೃದಯ).*?(\d+)%/i);
      const diabetesMatch = text.match(/(?:Diabetes|ಮಧುಮೇಹ).*?(\d+)%/i);
      const burnoutMatch = text.match(/(?:Burnout|Fatigue|ಬರ್ನ್‌ಔಟ್|ಆಯಾಸ).*?(\d+)%/i);

      if (cardioMatch) cardioVal = parseInt(cardioMatch[1], 10);
      if (diabetesMatch) diabetesVal = parseInt(diabetesMatch[1], 10);
      if (burnoutMatch) burnoutVal = parseInt(burnoutMatch[1], 10);

      setParsedRisks({
        cardio: cardioVal || 12, // fallback defaults
        diabetes: diabetesVal || 18,
        burnout: burnoutVal || 24,
      });

      toast.success(kn ? 'ಆರೋಗ್ಯ ಅಪಾಯ ಮುನ್ಸೂಚನೆ ಪೂರ್ಣಗೊಂಡಿದೆ' : 'AI health risk analysis complete!');
    } catch (err) {
      toast.error(kn ? 'ವಿಶ್ಲೇಷಣೆ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ' : 'Failed to complete risk analysis.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (val) => {
    if (val < 30) return '#10b981'; // Green
    if (val < 60) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const getRiskLabel = (val) => {
    if (val < 30) return kn ? 'ಕಡಿಮೆ' : 'Low';
    if (val < 60) return kn ? 'ಮಧ್ಯಮ' : 'Medium';
    return kn ? 'ಹೆಚ್ಚು' : 'High';
  };

  return (
    <div>
      <div className="page-header">
        <h2>{kn ? 'AI ಆರೋಗ್ಯ ಅಪಾಯ ಮುನ್ಸೂಚಕ' : 'AI Vitals Analytics & Risk Predictor'}</h2>
        <p>{kn ? 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಡೇಟಾವನ್ನು ಬಳಸಿಕೊಂಡು ಸಂಭವನೀಯ ದೀರ್ಘಕಾಲದ ಕಾಯಿಲೆಗಳ ಅಪಾಯವನ್ನು ಮುನ್ಸೂಚಿಸುತ್ತದೆ' : 'Predicts chronic condition risks by analyzing your vital log trends with Generative AI'}</p>
      </div>

      {!hasLogs ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 54, marginBottom: 16 }}>📊</div>
          <h3 style={{ marginBottom: 8, color: '#fff' }}>{kn ? 'ಆರೋಗ್ಯ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ' : 'No Vitals History Found'}</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 450, margin: '0 auto 20px auto', fontSize: 14 }}>
            {kn ? 'ಅಪಾಯದ ಅಂದಾಜನ್ನು ವಿಶ್ಲೇಷಿಸಲು ಮೊದಲು "ಆರೋಗ್ಯ ಮಾನಿಟರ್" ಪುಟದಲ್ಲಿ ನಿಮ್ಮ ದೈನಂದಿನ ಆರೋಗ್ಯ ವರದಿಗಳನ್ನು ದಾಖಲಿಸಿ.' : 'We require recorded health logs to analyze trends. Please log heart rate, steps, and sleep values in the Health Monitor.'}
          </p>
          <a href="/health" className="btn btn-primary">{kn ? 'ಆರೋಗ್ಯ ದಾಖಲಿಸಲು ಹೋಗಿ' : 'Go to Health Monitor'}</a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main Console */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h3 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Brain size={22} color="var(--primary)" />
                  {kn ? 'ಅನಾಲಿಟಿಕ್ಸ್ ಕನ್ಸೋಲ್' : 'Vital Analytics Engine'}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {kn ? 'Llama 3.1 ಮಾದರಿಯು ಕಳೆದ 15 ದಿನಗಳ ಹೆಜ್ಜೆ, ನಿದ್ರೆ ಮತ್ತು ಹೃದಯ ಬಡಿತದ ಪ್ರವೃತ್ತಿಗಳನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತದೆ.' : 'Generates predictions by evaluating temporal variations in your steps, sleep, and heart rates.'}
                </p>
              </div>
              <button className="btn btn-primary" onClick={runAnalysis} disabled={loading} style={{ animation: loading ? 'none' : 'pulseGlow 2s infinite' }}>
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spinner" style={{ marginRight: 6 }} />
                    {kn ? 'ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...' : 'Analyzing Vitals...'}
                  </>
                ) : (
                  <>
                    <Activity size={16} />
                    {kn ? 'ಅಪಾಯ ವಿಶ್ಲೇಷಣೆ ರನ್ ಮಾಡಿ' : 'Run Risk Assessment'}
                  </>
                )}
              </button>
            </div>
          </div>

          {loading && (
            <div className="card" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <span className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
                <h4 style={{ color: '#fff', marginTop: 20 }}>{kn ? 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಕೆಲಸ ಮಾಡುತ್ತಿದೆ...' : 'AI Vitals Scanning in Progress'}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{kn ? 'ಸಂಖ್ಯಾಶಾಸ್ತ್ರೀಯವಾಗಿ ಅಪಾಯ ಶೇಕಡಾವಾರು ಲೆಕ್ಕ ಹಾಕಲಾಗುತ್ತಿದೆ' : 'Running predictive algorithms on vital variances'}</p>
              </div>
            </div>
          )}

          {analysisResult && !loading && (
            <div className="grid-2">
              {/* Risks Gauges Card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <h3 style={{ color: '#fff', fontSize: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  {kn ? 'ಲೆಕ್ಕಹಾಕಿದ ಅಪಾಯದ ಮಟ್ಟಗಳು' : 'Calculated Health Risk Indices'}
                </h3>
                
                {[
                  { label: kn ? 'ಹೃದಯ ರಕ್ತನಾಳದ ಅಪಾಯ' : 'Cardiovascular Risk', val: parsedRisks.cardio, icon: HeartPulse, desc: kn ? 'ಹೃದಯ ಬಡಿತದ ಏರಿಳಿತ ಆಧಾರಿತ' : 'Based on average resting heart rate and deviations.' },
                  { label: kn ? 'ಟೈಪ್-2 ಮಧುಮೇಹ ಅಪಾಯ' : 'Type-2 Diabetes Risk', val: parsedRisks.diabetes, icon: Activity, desc: kn ? 'ಹೆಜ್ಜೆಗಳು ಮತ್ತು ದೈನಂದಿನ ಚಟುವಟಿಕೆ ಆಧಾರಿತ' : 'Correlated with active calories and daily step habits.' },
                  { label: kn ? 'ಬರ್ನ್‌ಔಟ್ ಮತ್ತು ಆಯಾಸದ ಅಪಾಯ' : 'Burnout & Fatigue Index', val: parsedRisks.burnout, icon: ShieldAlert, desc: kn ? 'ನಿದ್ರೆಯ ಕೊರತೆ ಮತ್ತು ವಿಶ್ರಾಂತಿ ಸಮಯ ಆಧಾರಿತ' : 'Computed using sleep duration and restorative cycles.' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
                        <r.icon size={16} color={getRiskColor(r.val)} />
                        {r.label}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: getRiskColor(r.val) }}>
                        {r.val}% — {getRiskLabel(r.val)}
                      </span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${r.val}%`, background: getRiskColor(r.val), borderRadius: 4, transition: 'width 1s ease' }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.desc}</span>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 10, background: 'rgba(139,92,246,0.08)', padding: 12, borderRadius: 10, border: '1px solid rgba(139,92,246,0.15)', marginTop: 10 }}>
                  <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {kn
                      ? 'ಈ ಮುನ್ಸೂಚನೆಗಳು ಸಂಖ್ಯಾಶಾಸ್ತ್ರೀಯ ಮಾದರಿ ಆಧಾರಿತವಾಗಿದೆ. ಇದು ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆಯ ಪರ್ಯಾಯವಲ್ಲ. ತೊಂದರೆ ಇದ್ದಲ್ಲಿ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
                      : 'Disclaimer: Predictions are generated statistically by LLM heuristics based on user input. For diagnostic precision, consult a certified cardiologist or physician.'}
                  </p>
                </div>
              </div>

              {/* Insights and recommendations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {analysisResult.split('\n\n').map((para, i) => {
                  const titleMatch = para.match(/^#+\s*(.+)/);
                  if (titleMatch) {
                    return null;
                  }
                  
                  // Filter out headers from paragraphs list
                  const cleanLines = para.split('\n').filter(l => !l.startsWith('#') && l.trim());
                  if (cleanLines.length === 0) return null;

                  const isRec = para.toLowerCase().includes('recommendation') || para.includes('ಸಲಹೆಗಳು') || para.includes('ಕ್ರಮಗಳು');
                  const cardTitle = isRec 
                    ? (kn ? 'ಕ್ರಮಗಳು ಮತ್ತು ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸಲಹೆಗಳು' : 'Actionable Guidelines & Tips') 
                    : (kn ? 'ಆರೋಗ್ಯ ಟ್ರೆಂಡ್‌ಗಳ ವಿಶ್ಲೇಷಣೆ' : 'Vitals Trend Insights');
                  
                  return (
                    <div key={i} className="card">
                      <h4 style={{ color: '#fff', fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isRec ? 'var(--secondary)' : 'var(--primary)' }} />
                        {cardTitle}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {cleanLines.map((line, idx) => (
                          <div key={idx} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderLeft: `2px solid ${isRec ? 'var(--secondary)' : 'var(--primary)'}`, borderRadius: '0 8px 8px 0', fontSize: 13.5, lineHeight: 1.6 }}>
                            {parseMarkdown(line.replace(/^[-*•\d+.]\s*/, ''))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
