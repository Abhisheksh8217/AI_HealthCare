import { useState } from 'react';
import api from '../api/axios';
import { useLang } from '../context/LanguageContext';
import { ChefHat, Sparkles, Flame, Apple, Heart, Compass, ShieldAlert, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseMarkdown } from '../utils/markdown';

export default function AIMealPlanner() {
  const { lang } = useLang();
  const kn = lang === 'kn';

  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);
  const [form, setForm] = useState({
    dietType: 'Vegetarian',
    conditions: '',
    goals: 'Weight Loss',
  });

  const generatePlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMealPlan(null);
    try {
      const { data } = await api.post('/ai/meal-plan', {
        dietType: form.dietType,
        conditions: form.conditions,
        goals: form.goals,
        lang,
      });
      setMealPlan(data.response);
      toast.success(kn ? 'ಆಹಾರ ಯೋಜನೆ ರಚಿಸಲಾಗಿದೆ!' : 'Custom meal plan generated!');
    } catch {
      toast.error(kn ? 'ಯೋಜನೆ ರಚಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to generate meal plan.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse markdown layout
  const parseMealPlan = (text) => {
    if (!text) return { nutrientSummary: [], meals: [], warnings: [], alternatives: [] };
    const lines = text.split('\n');
    let currentSection = '';
    const summary = [];
    const meals = [];
    const alternatives = [];
    const warnings = [];

    let currentMeal = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Section switches
      const isHeader = /^#+\s*/.test(trimmed);
      if (isHeader) {
        const title = trimmed.replace(/^#+\s*/, '').toLowerCase();
        if (title.includes('nutrient') || title.includes('ಪೋಷಕಾಂಶ')) currentSection = 'summary';
        else if (title.includes('menu') || title.includes('ಮೆನು') || title.includes('ಯೋಜನೆ')) currentSection = 'menu';
        else if (title.includes('alternative') || title.includes('ಪರ್ಯಾಯ')) currentSection = 'alternatives';
        else if (title.includes('guideline') || title.includes('warning') || title.includes('ಎಚ್ಚರಿಕೆ') || title.includes('ಸೂಚನೆ')) currentSection = 'warnings';
        continue;
      }

      if (currentSection === 'summary') {
        summary.push(trimmed.replace(/^[-*•\d+.]\s*/, ''));
      } else if (currentSection === 'menu') {
        // Detect meal items (e.g. "Breakfast:", "Lunch:")
        const isMealLabel = /^(Breakfast|Lunch|Dinner|Snacks|ಬೆಳಗಿನ ಉಪಹಾರ|ಮಧ್ಯಾಹ್ನದ ಊಟ|ರಾತ್ರಿಯ ಊಟ|ತಿಂಡಿ):\s*(.*)/i.test(trimmed);
        if (isMealLabel) {
          if (currentMeal) meals.push(currentMeal);
          const match = trimmed.match(/^(Breakfast|Lunch|Dinner|Snacks|ಬೆಳಗಿನ ಉಪಹಾರ|ಮಧ್ಯಾಹ್ನದ ಊಟ|ರಾತ್ರಿಯ ಊಟ|ತಿಂಡಿ):\s*(.*)/i);
          currentMeal = { type: match[1], title: match[2], items: [] };
        } else if (currentMeal) {
          currentMeal.items.push(trimmed.replace(/^[-*•\d+.]\s*/, ''));
        }
      } else if (currentSection === 'alternatives') {
        alternatives.push(trimmed.replace(/^[-*•\d+.]\s*/, ''));
      } else if (currentSection === 'warnings') {
        warnings.push(trimmed.replace(/^[-*•\d+.]\s*/, ''));
      }
    }

    if (currentMeal) meals.push(currentMeal);
    return { summary, meals, alternatives, warnings };
  };

  const parsed = parseMealPlan(mealPlan);

  return (
    <div>
      <div className="page-header">
        <h2>{kn ? 'AI ಆಹಾರ ತಜ್ಞ ಮತ್ತು ಪೌಷ್ಟಿಕಾಂಶ ಸಲಹೆಗಾರ' : 'AI Clinical Dietitian & Meal Planner'}</h2>
        <p>{kn ? 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಅಗತ್ಯತೆಗಳಿಗೆ ತಕ್ಕಂತೆ ದಿನನಿತ್ಯದ ಕಸ್ಟಮ್ ಆಹಾರ ಮೆನು ಸಿದ್ಧಪಡಿಸುತ್ತದೆ' : 'Generates customized, medical-grade daily diet plans aligned with your active health conditions'}</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Diet wizard form */}
        <div className="card">
          <h3 style={{ color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChefHat size={22} color="var(--primary)" />
            {kn ? 'ಆಹಾರ ಆದ್ಯತೆಗಳು' : 'Dietary Profile Wizard'}
          </h3>

          <form onSubmit={generatePlan}>
            <div className="form-group">
              <label className="form-label">{kn ? 'ಆಹಾರ ಶೈಲಿ' : 'Diet Style Preference'}</label>
              <select className="form-select" value={form.dietType} onChange={e => setForm({ ...form, dietType: e.target.value })}>
                <option value="Vegetarian">{kn ? 'ಸಸ್ಯಾಹಾರಿ (Vegetarian)' : 'Vegetarian'}</option>
                <option value="Vegan">{kn ? 'ಸಂಪೂರ್ಣ ಸಸ್ಯಾಹಾರಿ (Vegan)' : 'Vegan'}</option>
                <option value="Non-Vegetarian">{kn ? 'ಮಾಂಸಾಹಾರಿ (Non-Veg)' : 'Non-Vegetarian'}</option>
                <option value="Keto">{kn ? 'ಕೀಟೋ ಡಯಟ್ (Keto)' : 'Keto / Low-Carb'}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{kn ? 'ಆರೋಗ್ಯ ಕಾಳಜಿಗಳು / ಅಲರ್ಜಿಗಳು' : 'Medical Concerns & Allergies'}</label>
              <input
                className="form-input"
                placeholder={kn ? 'ಉದಾ: ಮಧುಮೇಹ, ಅಧಿಕ ರಕ್ತದೊತ್ತಡ, ಕಡಲೆಕಾಯಿ ಅಲರ್ಜಿ' : 'e.g. Diabetes, Hypertension, Nut Allergy, Celiac'}
                value={form.conditions}
                onChange={e => setForm({ ...form, conditions: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{kn ? 'ಆರೋಗ್ಯ ಗುರಿಗಳು' : 'Vitals & Fitness Target'}</label>
              <select className="form-select" value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })}>
                <option value="Weight Loss">{kn ? 'ತೂಕ ಇಳಿಕೆ (Weight Loss)' : 'Weight Loss'}</option>
                <option value="Muscle Gain">{kn ? 'ಸ್ನಾಯು ಗಳಿಕೆ (Muscle Gain)' : 'Muscle Gain'}</option>
                <option value="Energy Increase">{kn ? 'ಶಕ್ತಿ ಹೆಚ್ಚಿಸುವುದು (Boost Energy)' : 'Boost Energy & Stamina'}</option>
                <option value="Balanced Living">{kn ? 'ಸಮತೋಲಿತ ಆರೋಗ್ಯ (Healthy Maintenance)' : 'Healthy Maintenance'}</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" style={{ marginRight: 6 }} />
                  {kn ? 'ಯೋಜನೆ ಸಿದ್ಧಪಡಿಸುತ್ತಿದೆ...' : 'Generating Diet Plan...'}
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {kn ? 'ಡಯಟ್ ಪ್ಲಾನ್ ರಚಿಸಿ' : 'Formulate AI Meal Plan'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Screen */}
        <div>
          {!mealPlan && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '52px 24px' }}>
              <div style={{ fontSize: 50, marginBottom: 12 }}>🍎</div>
              <h4 style={{ color: '#fff', marginBottom: 6 }}>{kn ? 'ನಿಮ್ಮ ಡಯಟ್ ಪ್ಲಾನ್ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ' : 'Your Meal Plan Awaits'}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280, margin: '0 auto' }}>
                {kn ? 'ಎಡಭಾಗದಲ್ಲಿ ನಿಮ್ಮ ಆದ್ಯತೆಗಳನ್ನು ಆಯ್ದು ಫಾರ್ಮುಲೇಟ್ ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Configure your target targets on the wizard and trigger the dietitian AI.'}
              </p>
            </div>
          )}

          {loading && (
            <div className="card" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <span className="spinner" style={{ width: 38, height: 38, borderWidth: 3 }} />
                <h4 style={{ color: '#fff', marginTop: 16 }}>{kn ? 'ಪೌಷ್ಟಿಕಾಂಶ ಯೋಜನೆ ಸಿದ್ಧಪಡಿಸುತ್ತಿದೆ...' : 'Calculating Macro Budgets'}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{kn ? 'ಕ್ಯಾಲೋರಿ ನಿಯಂತ್ರಣ ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ' : 'Tailoring food combinations and nutrient densities'}</p>
              </div>
            </div>
          )}

          {mealPlan && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Macros Summary Panel */}
              {parsed.summary.length > 0 && (
                <div className="card" style={{ background: 'var(--primary-light)', borderColor: 'rgba(139,92,246,0.3)' }}>
                  <h4 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 10 }}>
                    <Flame size={16} color="var(--primary)" />
                    {kn ? 'ದೈನಂದಿನ ಪೋಷಕಾಂಶಗಳ ಸಾರಾಂಶ' : 'Target Macronutrient Profile'}
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {parsed.summary.map((s, idx) => (
                      <span key={idx} className="badge badge-purple" style={{ textTransform: 'none', padding: '6px 12px' }}>
                        {parseMarkdown(s)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Day Menu Cards */}
              {parsed.meals.length > 0 ? (
                parsed.meals.map((meal, i) => (
                  <div key={i} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--secondary)', textTransform: 'capitalize' }}>
                        {meal.type}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {meal.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {meal.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
                          <ArrowRight size={13} color="var(--secondary)" style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1 }}>{parseMarkdown(item)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="card" style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {mealPlan}
                </div>
              )}

              {/* Local food alternatives */}
              {parsed.alternatives.length > 0 && (
                <div className="card">
                  <h4 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 12 }}>
                    <Compass size={16} color="var(--secondary)" />
                    {kn ? 'ಸ್ಥಳೀಯ ಆಹಾರ ಪರ್ಯಾಯಗಳು (ದಕ್ಷಿಣ ಭಾರತೀಯ)' : 'Localized South Indian Food Equivalents'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {parsed.alternatives.map((alt, i) => (
                      <div key={i} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: 13, borderLeft: '2px solid var(--secondary)' }}>
                        {parseMarkdown(alt)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical safety warnings */}
              {parsed.warnings.length > 0 && (
                <div className="card" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
                  <h4 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 10 }}>
                    <ShieldAlert size={16} />
                    {kn ? 'ವೈದ್ಯಕೀಯ ಆಹಾರ ಎಚ್ಚರಿಕೆಗಳು' : 'Clinical Diet Advisories'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {parsed.warnings.map((w, i) => (
                      <p key={i} style={{ fontSize: 12.5, color: '#f87171', lineHeight: 1.5 }}>
                        {parseMarkdown(w)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
