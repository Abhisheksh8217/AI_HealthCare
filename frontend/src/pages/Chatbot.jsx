import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import { Send, Bot, Mic, MicOff, Volume2, VolumeX, Square } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { parseMarkdown } from '../utils/markdown';

export default function Chatbot() {
  const { t, lang } = useLang();
  const kn = lang === 'kn';

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: kn
        ? 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಗ್ರಾಮೀಣ ಆರೋಗ್ಯ ಸಹಾಯಕ. ಆರೋಗ್ಯ, ಸ್ವಾಸ್ಥ್ಯ ಅಥವಾ ವೈದ್ಯಕೀಯ ವಿಷಯಗಳ ಬಗ್ಗೆ ಯಾವುದಾದರೂ ಕೇಳಿ. ನೀವು ಮೈಕ್ರೊಫೋನ್ ಬಳಸಿ ಮಾತನಾಡಬಹುದು!'
        : "Hello! I'm your AI rural health assistant. Ask me anything about health, symptoms, or medical topics. You can speak to me using the microphone!"
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const activeUtteranceRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
        toast.success(kn ? 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಾ ಇದ್ದೇನೆ... ಮಾತನಾಡಿ' : 'Listening... Speak now.');
      };

      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput(transcript);
        send(transcript);
      };

      rec.onerror = (e) => {
        console.warn('Speech Recognition error:', e.error);
        if (e.error !== 'no-speech') {
          toast.error(kn ? 'ಧ್ವನಿ ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ' : 'Speech recognition error.');
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
    
    // Stop synthesis on unmount
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [lang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error(kn ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್ ಧ್ವನಿ ಇನ್ಪುಟ್ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ' : 'Speech-to-text is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Cancel active voice output before listening
      stopSpeaking();
      recognitionRef.current.lang = kn ? 'kn-IN' : 'en-IN';
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Text to Speech
  const speakText = (text) => {
    if (!window.speechSynthesis) {
      toast.error(kn ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್ ಧ್ವನಿ ಔಟ್‌ಪುಟ್ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ' : 'Text-to-speech is not supported in this browser.');
      return;
    }

    stopSpeaking();

    // Auto-detect Kannada language using Unicode range
    const hasKannada = /[\u0c80-\u0cff]/.test(text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = hasKannada ? 'kn-IN' : 'en-IN';
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Try to locate a natural sounding voice
    const voices = window.speechSynthesis.getVoices();
    if (hasKannada) {
      const knVoice = voices.find(v => v.lang.includes('kn-IN') || v.lang.includes('kn'));
      if (knVoice) utterance.voice = knVoice;
    } else {
      const enVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('Google') || v.lang.includes('en-US'));
      if (enVoice) utterance.voice = enVoice;
    }

    activeUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);
    stopSpeaking();

    try {
      const { data } = await api.post('/ai/chat', { message: msg, lang });
      setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
      
      // Auto-read response if enabled
      if (autoRead) {
        // Delay slightly for natural pacing
        setTimeout(() => speakText(data.response), 500);
      }
    } catch {
      const errMsg = kn
        ? 'ಕ್ಷಮಿಸಿ, ಸಂಪರ್ಕಿಸಲು ತೊಂದರೆ ಆಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
        : "Sorry, I'm having trouble connecting. Please try again.";
      setMessages(prev => [...prev, { role: 'ai', text: errMsg }]);
      if (autoRead) speakText(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTIONS = kn ? [
    'ಹೃದಯದ ಆರೋಗ್ಯಕ್ಕೆ ಯಾವ ಆಹಾರಗಳು ಒಳ್ಳೆಯದು?',
    'ನಾನು ಪ್ರತಿದಿನ ಎಷ್ಟು ನೀರು ಕುಡಿಯಬೇಕು?',
    'ಅಧಿಕ ರಕ್ತದೊತ್ತಡದ ಲಕ್ಷಣಗಳು ಯಾವುವು?',
    'ನನ್ನ ನಿದ್ರೆಯ ಗುಣಮಟ್ಟವನ್ನು ಹೇಗೆ ಸುಧಾರಿಸಬಹುದು?',
  ] : [
    'What foods are good for heart health?',
    'How much water should I drink daily?',
    'What are signs of high blood pressure?',
    'How can I improve my sleep quality?',
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2>{t('healthChatbot')}</h2>
          <p>{kn ? 'ಆರೋಗ್ಯ, ರೋಗಲಕ್ಷಣಗಳು, ಮತ್ತು ಸ್ವಾಸ್ಥ್ಯದ ಬಗ್ಗೆ ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ ಅಥವಾ ಬರೆಯಿರಿ' : 'Ask questions about health, symptoms, or medications in your native language'}</p>
        </div>
        
        {/* Controls Toolbar */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className={`btn btn-sm ${autoRead ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAutoRead(!autoRead)}
            title={kn ? 'ಸ್ವಯಂ ಓದುವಿಕೆ ಆನ್/ಆಫ್' : 'Toggle Voice Auto-Read'}
          >
            {autoRead ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span style={{ marginLeft: 4, fontSize: 12 }}>
              {kn ? 'ಸ್ವಯಂ ಓದು' : 'Auto-Read'}
            </span>
          </button>
          
          {isSpeaking && (
            <button 
              className="btn btn-sm btn-danger"
              onClick={stopSpeaking}
              title={kn ? 'ಮಾತನಾಡುವುದನ್ನು ನಿಲ್ಲಿಸಿ' : 'Stop Speaking'}
            >
              <Square size={12} fill="currentColor" />
              <span style={{ marginLeft: 4, fontSize: 12 }}>{kn ? 'ನಿಲ್ಲಿಸು' : 'Stop'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-message ${m.role}`} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                    {m.role === 'ai' && <Bot size={13} />}
                    {m.role === 'ai' ? (kn ? 'AI ಸಹಾಯಕ' : 'AI Assistant') : (kn ? 'ನೀವು' : 'You')}
                  </div>
                  
                  {/* Message Speaker Button */}
                  <button
                    onClick={() => speakText(m.text)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)' }}
                    title={kn ? 'ವರದಿಯನ್ನು ಜೋರಾಗಿ ಓದಿ' : 'Read message aloud'}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Volume2 size={13} />
                  </button>
                </div>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 14.5 }}>{parseMarkdown(m.text)}</p>
              </div>
            ))}
            
            {loading && (
              <div className="chat-message ai">
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '6px 0' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s infinite' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s 0.2s infinite' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s 0.4s infinite' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              {kn ? 'ಸೂಚಿಸಲಾದ ಪ್ರಶ್ನೆಗಳು:' : 'Quick Suggestions:'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} className="btn btn-secondary btn-sm" onClick={() => send(s)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-input-row">
            {/* Microphone Button */}
            <button 
              className={`btn btn-icon ${isListening ? 'btn-danger' : 'btn-secondary'}`}
              onClick={toggleListening}
              style={{
                animation: isListening ? 'listeningPulse 1.2s infinite' : 'none',
                boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
              }}
              title={isListening ? (kn ? 'ಮಾತು ಮುಗಿಸಿ' : 'Stop Listening') : (kn ? 'ಮಾತನಾಡಿ' : 'Voice Input')}
              disabled={loading}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            
            <input
              className="form-input"
              placeholder={kn ? 'ಆರೋಗ್ಯ ಪ್ರಶ್ನೆ ಕೇಳಿ ಅಥವಾ ಧ್ವನಿ ಬಟನ್ ಒತ್ತಿ...' : 'Ask a health question or click microphone...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading || isListening}
            />
            
            <button className="btn btn-primary" onClick={() => send()} disabled={loading || isListening || !input.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Listening pulse animations in cosmic style */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
        @keyframes listeningPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
