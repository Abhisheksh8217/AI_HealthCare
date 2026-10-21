import { useState, useRef } from 'react';
import api from '../api/axios';
import { useLang } from '../context/LanguageContext';
import { Upload, Sparkles, AlertTriangle, ClipboardList, ChevronRight, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseMarkdown } from '../utils/markdown';

// Extract text from PDF using pdfjs-dist via CDN worker
async function extractPdfText(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text.trim();
}

const SECTION_STYLES = [
  { color: '#2563eb', bg: '#eff6ff' },
  { color: '#10b981', bg: '#f0fdf4' },
  { color: '#f59e0b', bg: '#fffbeb' },
  { color: '#7c3aed', bg: '#faf5ff' },
  { color: '#ef4444', bg: '#fef2f2' },
];

function parseResult(text) {
  if (!text) return [];
  const lines = text.split('\n').filter(l => l.trim());
  const sections = [];
  let current = null;
  for (const line of lines) {
    const trimmed = line.trim();
    const isHeading = /^(\*\*|##)/.test(trimmed) || (trimmed.endsWith(':') && trimmed.length < 60 && !/^[-•*\d]/.test(trimmed));
    if (isHeading) {
      if (current) sections.push(current);
      current = { heading: trimmed.replace(/\*\*/g, '').replace(/^#+\s*/, '').replace(/:$/, ''), items: [] };
    } else {
      if (!current) current = { heading: '', items: [] };
      const clean = trimmed.replace(/^[-•*\d+.]\s*/, '').trim();
      if (clean) current.items.push(clean);
    }
  }
  if (current) sections.push(current);
  return sections.filter(s => s.items.length > 0);
}

export default function ReportAnalyser() {
  const { lang } = useLang();
  const kn = lang === 'kn';
  const fileRef = useRef(null);

  const [reportText, setReportText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setFileLoading(true);
    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const text = await extractPdfText(file);
        if (!text) throw new Error('No text found in PDF');
        setReportText(text);
        toast.success(kn ? 'PDF ಯಶಸ್ವಿಯಾಗಿ ಓದಲಾಗಿದೆ' : 'PDF extracted successfully');
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => setReportText(ev.target.result);
        reader.readAsText(file);
      }
    } catch (err) {
      toast.error(kn ? 'ಫೈಲ್ ಓದಲು ವಿಫಲವಾಗಿದೆ: ' + err.message : 'Failed to read file: ' + err.message);
      setFileName('');
    } finally {
      setFileLoading(false);
      e.target.value = '';
    }
  };

  const analyse = async () => {
    if (!reportText.trim()) {
      toast.error(kn ? 'ದಯವಿಟ್ಟು ವರದಿ ನಮೂದಿಸಿ' : 'Please enter or upload a report');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ai/summarize-report', { reportText, lang });
      setResult(data.response);
    } catch {
      toast.error(kn ? 'ವರದಿ ವಿಶ್ಲೇಷಣೆ ವಿಫಲವಾಗಿದೆ' : 'Failed to analyse report');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setReportText(''); setFileName(''); setResult(null); };

  const sections = parseResult(result);

  return (
    <div>
      <div className="page-header">
        <h2>{kn ? 'AI ವರದಿ ವಿಶ್ಲೇಷಕ' : 'AI Report Analyser'}</h2>
        <p>{kn ? 'ವೈದ್ಯರ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಥವಾ ವೈದ್ಯಕೀಯ ವರದಿ ಅಪ್ಲೋಡ್ ಮಾಡಿ — AI ಸರಳ ಭಾಷೆಯಲ್ಲಿ ವಿವರಿಸಿ ಮುಂದಿನ ಹಂತಗಳನ್ನು ತಿಳಿಸುತ್ತದೆ' : 'Upload a prescription or medical report — AI explains it simply and tells you the next steps'}</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Input */}
        <div className="card">
          <div className="card-header"><div className="card-title">{kn ? 'ವರದಿ ನಮೂದಿಸಿ' : 'Enter Report'}</div></div>

          {/* Drop zone */}
          <div
            onClick={() => !fileLoading && fileRef.current.click()}
            style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: 20, textAlign: 'center', cursor: fileLoading ? 'wait' : 'pointer', marginBottom: 16, background: 'var(--bg)', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <input ref={fileRef} type="file" accept=".txt,.text,.pdf" style={{ display: 'none' }} onChange={handleFile} />
            {fileLoading ? (
              <><span className="spinner" style={{ marginBottom: 8 }} /><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{kn ? 'PDF ಓದುತ್ತಿದೆ...' : 'Reading PDF...'}</div></>
            ) : (
              <>
                <Upload size={28} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {fileName ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <FileText size={16} color="var(--primary)" /> {fileName}
                      <button onClick={e => { e.stopPropagation(); clear(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><X size={14} /></button>
                    </span>
                  ) : (kn ? 'PDF ಅಥವಾ .txt ಫೈಲ್ ಅಪ್ಲೋಡ್ ಮಾಡಿ' : 'Upload PDF or .txt file')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {kn ? 'ಅಥವಾ ಕೆಳಗೆ ನೇರವಾಗಿ ಅಂಟಿಸಿ' : 'or paste text directly below'}
                </div>
              </>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">{kn ? 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ / ವರದಿ ಪಠ್ಯ' : 'Prescription / Report Text'}</label>
            <textarea className="form-textarea" rows={11}
              placeholder={kn
                ? 'ಇಲ್ಲಿ ವೈದ್ಯರ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಂಟಿಸಿ...\n\nಉದಾ:\nರೋಗ ನಿರ್ಣಯ: ಟೈಪ್ 2 ಮಧುಮೇಹ\nಔಷಧ: ಮೆಟ್ಫಾರ್ಮಿನ್ 500mg - ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ'
                : 'Paste prescription or report here...\n\nExample:\nDiagnosis: Type 2 Diabetes\nMedication: Metformin 500mg twice daily\nFollow-up: After 3 months'}
              value={reportText} onChange={e => setReportText(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 13 }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={analyse} disabled={loading || !reportText.trim()} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <><span className="spinner" /> {kn ? 'ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...' : 'Analysing...'}</> : <><Sparkles size={16} /> {kn ? 'AI ವಿಶ್ಲೇಷಣೆ ಮಾಡಿ' : 'Analyse with AI'}</>}
            </button>
            {reportText && <button className="btn btn-secondary" onClick={clear}>{kn ? 'ತೆರವು' : 'Clear'}</button>}
          </div>

          <div style={{ marginTop: 14, padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', display: 'flex', gap: 10 }}>
            <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>
              {kn ? 'ಇದು ಮಾಹಿತಿ ಉದ್ದೇಶಕ್ಕಾಗಿ ಮಾತ್ರ. ಯಾವಾಗಲೂ ನಿಮ್ಮ ವೈದ್ಯರ ಸಲಹೆ ಅನುಸರಿಸಿ.' : "For informational purposes only. Always follow your doctor's advice."}
            </p>
          </div>
        </div>

        {/* Result */}
        <div>
          {!result && !loading && (
            <div className="card">
              <div className="empty-state" style={{ padding: '48px 24px' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🩺</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{kn ? 'AI ವಿಶ್ಲೇಷಣೆ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ' : 'AI analysis will appear here'}</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280, margin: '0 auto' }}>
                  {kn ? 'ವರದಿ ನಮೂದಿಸಿ ಮತ್ತು "AI ವಿಶ್ಲೇಷಣೆ ಮಾಡಿ" ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Enter a report and click "Analyse with AI"'}
                </p>
                <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['PDF', '.txt', kn ? 'ಪಠ್ಯ ಅಂಟಿಸಿ' : 'Paste text'].map(f => (
                    <span key={f} className="badge badge-blue">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="loading-page" style={{ height: 300 }}>
                <div style={{ textAlign: 'center' }}>
                  <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
                  <p style={{ marginTop: 16, fontWeight: 500 }}>{kn ? 'ವರದಿ ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...' : 'Analysing your report...'}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{kn ? 'Groq AI ಮಾಹಿತಿ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುತ್ತಿದೆ' : 'Groq AI is processing the medical information'}</p>
                </div>
              </div>
            </div>
          )}

          {result && !loading && (
            <>
              <div className="card" style={{ marginBottom: 14, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ClipboardList size={20} color="white" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#065f46' }}>{kn ? 'ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ' : 'Analysis Complete'}</div>
                    <div style={{ fontSize: 12, color: '#047857' }}>{kn ? 'Groq AI (Llama 3.1) ಮೂಲಕ' : 'Powered by Groq AI (Llama 3.1)'}</div>
                  </div>
                </div>
              </div>

              {sections.length > 0 ? sections.map((section, idx) => {
                const s = SECTION_STYLES[idx % SECTION_STYLES.length];
                return (
                  <div key={idx} className="card" style={{ marginBottom: 12 }}>
                    {section.heading && (
                      <div style={{ fontWeight: 700, fontSize: 14, color: s.color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        {section.heading}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {section.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: s.bg, borderRadius: 8 }}>
                          <ChevronRight size={15} color={s.color} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 14, lineHeight: 1.6 }}>{parseMarkdown(item)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }) : (
                <div className="card"><div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{result}</div></div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
