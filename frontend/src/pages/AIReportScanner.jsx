import { useState } from 'react';
import api from '../api/axios';
import { Upload, FileText, CheckCircle, AlertTriangle, RefreshCw, Bot } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export default function AIReportScanner() {
  const { t, lang } = useLang();
  const kn = lang === 'kn';

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      toast.error(kn ? 'ದಯವಿಟ್ಟು ಕೇವಲ ಚಿತ್ರ ಫೈಲ್‌ಗಳನ್ನು ಮಾತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Please upload image files only (PNG, JPG, JPEG).');
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setAnalysis('');
  };

  const handleScan = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lang', lang);

    try {
      const { data } = await api.post('/ai/scan-report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnalysis(data.response);
      toast.success(kn ? 'ವರದಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ವಿಶ್ಲೇಷಿಸಲಾಗಿದೆ!' : 'Report analyzed successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.response || (kn ? 'ವಿಶ್ಲೇಷಣೆ ವಿಫಲವಾಗಿದೆ' : 'Analysis failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview('');
    setAnalysis('');
  };

  return (
    <div>
      <div className="page-header">
        <h2>{kn ? 'AI ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಮತ್ತು ವರದಿ ಸ್ಕ್ಯಾನರ್' : 'AI Prescription & Report Scanner'}</h2>
        <p>
          {kn
            ? 'ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಥವಾ ಲ್ಯಾಬ್ ವರದಿಯ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ನಮ್ಮ AI OCR ಸಿಸ್ಟಮ್ ಪ್ರಮುಖ ವಿವರಗಳನ್ನು ಓದಿ ವಿಶ್ಲೇಷಿಸುತ್ತದೆ.'
            : 'Upload an image of a handwritten prescription or lab report. Our AI Vision system will extract key metrics, doses, and flag abnormal parameters.'}
        </p>
      </div>

      <div className="grid-2">
        {/* Left Card - Upload & Scan */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>{kn ? 'ಫೈಲ್ ಅಪ್‌ಲೋಡ್' : 'Upload Document'}</h3>

          {!preview ? (
            <label
              style={{
                flex: 1,
                minHeight: 250,
                border: '2px dashed var(--border)',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.01)',
                transition: 'all 0.2s',
                padding: 20,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
              }}
            >
              <Upload size={38} style={{ color: 'var(--primary)', marginBottom: 12 }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{kn ? 'ಚಿತ್ರವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ' : 'Choose Prescription Image'}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>PNG, JPG, JPEG</span>
              <input type="file" onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
            </label>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Image Preview Box with Scanning Laser */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#07090e',
                  aspectRatio: '4/3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  border: '1px solid var(--border)',
                }}
              >
                <img src={preview} alt="Upload preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />

                {loading && (
                  <>
                    <div className="scanner-laser" />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(6, 182, 212, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(1px)',
                      }}
                    >
                      <div
                        style={{
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid var(--primary)',
                          borderRadius: 8,
                          padding: '12px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                        }}
                      >
                        <RefreshCw size={16} className="spin" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{kn ? 'ವರದಿಯನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Analyzing medical document...'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" onClick={reset} style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                  {kn ? 'ಮತ್ತೊಂದು ಫೈಲ್' : 'Reset File'}
                </button>
                <button className="btn btn-primary" onClick={handleScan} style={{ flex: 2, justifyContent: 'center' }} disabled={loading}>
                  <Bot size={16} /> {kn ? 'ಈಗ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ' : 'Start AI Analysis'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Card - Analysis Results */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <FileText size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0 }}>{kn ? 'ಸ್ಕ್ಯಾನರ್ ವಿಶ್ಲೇಷಣೆ ಫಲಿತಾಂಶ' : 'Clinical Scanner Report'}</h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', paddingRight: 4 }}>
            {analysis ? (
              <div className="markdown-body">
                {/* Render Markdown content */}
                {/* Standard replacement for basic markdown rendering */}
                <div dangerouslySetInnerHTML={{
                  __html: renderMarkdown(analysis)
                }} />
              </div>
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: 40,
                }}
              >
                <Bot size={44} style={{ opacity: 0.25, marginBottom: 12 }} />
                <p style={{ fontSize: 14 }}>
                  {kn
                    ? 'ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ವಿವರಗಳು, ಡೋಸ್ ಮತ್ತು ಲ್ಯಾಬ್ ಡೇಟಾ ನೋಡಲು "ಈಗ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ" ಒತ್ತಿ.'
                    : 'Upload a prescription image and click "Start AI Analysis" to extract prescription tables, dosage guidelines, and biomarker highlights.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .scanner-laser {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, rgba(6,182,212,0) 0%, rgba(6,182,212,1) 50%, rgba(6,182,212,0) 100%);
          box-shadow: 0 0 12px rgba(6, 182, 212, 0.9);
          animation: laserScan 2s infinite ease-in-out;
        }
        @keyframes laserScan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .spin {
          animation: spinnerAnimation 1.2s infinite linear;
        }
        @keyframes spinnerAnimation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Basic Markdown rendering styles */
        .markdown-body h1, .markdown-body h2 {
          font-size: 16px;
          font-weight: 600;
          color: var(--primary);
          margin-top: 16px;
          margin-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 4px;
        }
        .markdown-body h3 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-light);
          margin-top: 12px;
          margin-bottom: 6px;
        }
        .markdown-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          font-size: 13px;
        }
        .markdown-body th {
          background: rgba(139, 92, 246, 0.12);
          color: var(--primary);
          font-weight: 600;
          text-align: left;
          padding: 8px;
          border: 1px solid var(--border);
        }
        .markdown-body td {
          padding: 8px;
          border: 1px solid var(--border);
        }
        .markdown-body ul, .markdown-body ol {
          padding-left: 20px;
          margin: 8px 0;
          font-size: 13.5px;
          line-height: 1.5;
        }
        .markdown-body li {
          margin-bottom: 4px;
        }
        .markdown-body p {
          font-size: 13.5px;
          line-height: 1.5;
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
}

// Simple client-side markdown formatter helper
function renderMarkdown(md) {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Tables
    .split('\n');

  let inTable = false;
  let tableHeaderParsed = false;
  let result = [];

  for (let line of html) {
    line = line.trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        result.push('<table>');
        tableHeaderParsed = false;
      }
      
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => c.startsWith('-'))) {
        // Divider row
        continue;
      }

      result.push('<tr>');
      for (let cell of cells) {
        const tag = (!tableHeaderParsed) ? 'th' : 'td';
        result.push(`<${tag}>${cell}</${tag}>`);
      }
      result.push('</tr>');
      if (!tableHeaderParsed) tableHeaderParsed = true;
    } else {
      if (inTable) {
        inTable = false;
        result.push('</table>');
      }

      if (line.startsWith('# ')) {
        result.push(`<h1>${line.substring(2)}</h1>`);
      } else if (line.startsWith('## ')) {
        result.push(`<h2>${line.substring(3)}</h2>`);
      } else if (line.startsWith('### ')) {
        result.push(`<h3>${line.substring(4)}</h3>`);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        result.push(`<ul><li>${line.substring(2)}</li></ul>`);
      } else if (/^\d+\.\s/.test(line)) {
        result.push(`<ol><li>${line.replace(/^\d+\.\s/, '')}</li></ol>`);
      } else if (line.length > 0) {
        // Check for highlighted warning alerts
        if (line.includes('⚠️') || line.includes('🚨') || line.includes('CRITICAL') || line.includes('DANGER')) {
          result.push(`<p style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 8px 12px; border-radius: 4px; margin: 8px 0; color: #f87171;">${line}</p>`);
        } else {
          result.push(`<p>${line}</p>`);
        }
      }
    }
  }

  if (inTable) result.push('</table>');

  // Group adjacent <ul> and <ol> blocks
  let rawHtml = result.join('\n');
  rawHtml = rawHtml.replace(/<\/ul>\s*<ul>/g, '');
  rawHtml = rawHtml.replace(/<\/ol>\s*<ol>/g, '');
  return rawHtml;
}
