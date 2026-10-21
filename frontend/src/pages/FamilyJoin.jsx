import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Users, CheckCircle, ArrowRight } from 'lucide-react';

export default function FamilyJoin() {
  const { familyId } = useParams();
  const { user } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const kn = lang === 'kn';

  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [relation, setRelation] = useState('');
  const [joining, setJoining] = useState(false);

  const relations = kn
    ? ['ಪತಿ/ಪತ್ನಿ', 'ಪೋಷಕ', 'ಮಗು', 'ಒಡಹುಟ್ಟಿದವರು', 'ಅಜ್ಜ/ಅಜ್ಜಿ', 'ಇತರ']
    : ['Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent', 'Other'];

  useEffect(() => {
    // Fetch family invite info publicly
    api.get(`/family/invite-info/${familyId}`)
      .then(r => {
        setFamilyName(r.data.name);
        setLoading(false);
      })
      .catch(() => {
        toast.error(kn ? 'ಕುಟುಂಬ ಆಮಂತ್ರಣ ಕೊಂಡಿ ಅಮಾನ್ಯವಾಗಿದೆ' : 'Invalid family invitation link');
        setLoading(false);
      });
  }, [familyId, kn]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!relation) {
      toast.error(kn ? 'ದಯವಿಟ್ಟು ಸಂಬಂಧವನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Please select your relation');
      return;
    }
    setJoining(true);
    try {
      const { data } = await api.post(`/family/join/${familyId}`, { relation });
      toast.success(data.message || (kn ? 'ಕುಟುಂಬ ಗುಂಪಿಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಕೊಂಡಿದ್ದೀರಿ!' : 'Successfully joined family group!'));
      navigate('/family');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join family group');
    } finally {
      setJoining(false);
    }
  };

  const handleRedirect = (path) => {
    localStorage.setItem('pendingJoinFamilyId', familyId);
    navigate(path);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!familyName) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
        <div className="card" style={{ maxWidth: 450, padding: 30 }}>
          <h3 style={{ color: 'var(--danger)', marginTop: 0 }}>{kn ? 'ಲಿಂಕ್ ಅಮಾನ್ಯವಾಗಿದೆ' : 'Invalid Link'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {kn ? 'ಈ ಆಮಂತ್ರಣ ಕೊಂಡಿ ಅವಧಿ ಮುಗಿದಿದೆ ಅಥವಾ ಅಸ್ತಿತ್ವದಲ್ಲಿಲ್ಲ.' : 'This invitation link has expired or is invalid.'}
          </p>
          <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginTop: 12 }}>
            {kn ? 'ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ' : 'Go Home'}
          </button>
        </div>
      </div>
    );
  }

  // User is not logged in: prompt them to sign in
  if (!user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="card" style={{ maxWidth: 500, padding: '32px 24px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, rgba(6, 182, 212, 0.03) 100%)', border: '1px solid var(--border)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Users size={26} />
          </div>
          <h2 style={{ fontSize: 20, color: '#fff', margin: '0 0 8px 0' }}>
            {kn ? 'ಕುಟುಂಬ ಆಮಂತ್ರಣ!' : 'Family Invitation!'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 24px 0' }}>
            {kn 
              ? `ನೀವು "${familyName}" ಆರೋಗ್ಯ ಗುಂಪಿಗೆ ಸೇರಲು ಆಹ್ವಾನಿಸಲ್ಪಟ್ಟಿದ್ದೀರಿ. ಮುಂದುವರಿಯಲು ದಯವಿಟ್ಟು ಲಾಗ್ ಇನ್ ಮಾಡಿ ಅಥವಾ ಹೊಸ ಖಾತೆಯನ್ನು ರಚಿಸಿ.`
              : `You have been invited to join the "${familyName}" health group. Please sign in or create an account to proceed.`}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => handleRedirect('/login')} style={{ flex: 1, justifyContent: 'center' }}>
              {kn ? 'ಲಾಗ್ ಇನ್ ಮಾಡಿ' : 'Sign In'} <ArrowRight size={16} />
            </button>
            <button className="btn btn-secondary" onClick={() => handleRedirect('/register')} style={{ flex: 1, justifyContent: 'center' }}>
              {kn ? 'ಖಾತೆ ರಚಿಸಿ' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is logged in: choose relation and join
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ maxWidth: 500, width: '100%', padding: '32px 24px', border: '1px solid rgba(139, 92, 246, 0.2)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Users size={26} />
          </div>
          <h2 style={{ fontSize: 21, color: '#fff', margin: '0 0 8px 0' }}>
            {kn ? 'ಕುಟುಂಬ ಆರೋಗ್ಯ ಗುಂಪಿಗೆ ಸೇರಿ' : 'Join Family Group'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            {kn
              ? `ನೀವು "${familyName}" ಗೆ ಸೇರಲು ವಿನಂತಿಸುತ್ತಿದ್ದೀರಿ. ಈ ಕುಟುಂಬದಲ್ಲಿ ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ದಯವಿಟ್ಟು ಆಯ್ಕೆಮಾಡಿ.`
              : `You are joining "${familyName}". Please select your relation to the family group below.`}
          </p>
        </div>

        <form onSubmit={handleJoin}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">{kn ? 'ನಿಮ್ಮ ಸಂಬಂಧ' : 'Your Relation'}</label>
            <select 
              className="form-select" 
              value={relation} 
              onChange={e => setRelation(e.target.value)} 
              required
              style={{ width: '100%' }}
            >
              <option value="">{kn ? 'ಆಯ್ಕೆ ಮಾಡಿ...' : 'Select relation...'}</option>
              {relations.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button 
            className="btn btn-primary" 
            type="submit" 
            disabled={joining} 
            style={{ width: '100%', justifyContent: 'center', height: 42, fontSize: 14.5 }}
          >
            {joining ? (
              <span className="spinner" />
            ) : (
              <>
                <CheckCircle size={16} /> {kn ? 'ಸೇರಲು ದೃಢೀಕರಿಸಿ' : 'Confirm & Join Group'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
