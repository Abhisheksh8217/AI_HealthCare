const Groq = require('groq-sdk');
const db = require('../config/db');

const SYMPTOM_FALLBACK = {
  en: {
    fever: 'Fever may indicate infection. Stay hydrated, rest, and take paracetamol if above 38.5°C. See a doctor if it persists over 3 days.',
    cough: 'Persistent cough could be viral or bacterial. Honey-lemon tea helps. See a doctor if coughing blood or lasting over 2 weeks.',
    headache: 'Headaches are often from dehydration or stress. Drink water, rest in a dark room. Seek help for sudden severe headaches.',
    fatigue: 'Fatigue may be from poor sleep, anemia, or stress. Ensure 7-8 hours sleep and balanced nutrition.',
    'body pain': 'Body pain often follows viral illness. Rest, hydration, and mild pain relievers help. Persistent pain needs evaluation.',
    nausea: 'Nausea can be from food, motion, or infection. Ginger tea helps. Avoid solid food temporarily.',
    'chest pain': '⚠️ Chest pain can be serious. If accompanied by breathlessness or arm pain, call emergency services immediately.',
    breathlessness: '⚠️ Breathlessness needs urgent attention. Sit upright, stay calm, and seek emergency care if severe.',
  },
  kn: {
    fever: 'ಜ್ವರವು ಸೋಂಕನ್ನು ಸೂಚಿಸಬಹುದು. ನೀರು ಕುಡಿಯಿರಿ, ವಿಶ್ರಾಂತಿ ತೆಗೆಕೊಳ್ಳಿ. 38.5°C ಮೇಲಿದ್ದರೆ ಪ್ಯಾರಾಸಿಟಮಾಲ್ ತೆಗೆದುಕೊಳ್ಳಿ. 3 ದಿನಗಳಿಗಿಂತ ಹೆಚ್ಚು ಇದ್ದರೆ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.',
    cough: 'ನಿರಂತರ ಕೆಮ್ಮು ವೈರಲ್ ಅಥವಾ ಬ್ಯಾಕ್ಟೀರಿಯಲ್ ಆಗಿರಬಹುದು. ಜೇನು-ನಿಂಬೆ ಚಹಾ ಸಹಾಯ ಮಾಡುತ್ತದೆ. 2 ವಾರಗಳಿಗಿಂತ ಹೆಚ್ಚು ಇದ್ದರೆ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.',
    headache: 'ತಲೆನೋವು ಸಾಮಾನ್ಯವಾಗಿ ನಿರ್ಜಲೀಕರಣ ಅಥವಾ ಒತ್ತಡದಿಂದ ಬರುತ್ತದೆ. ನೀರು ಕುಡಿಯಿರಿ, ಕತ್ತಲೆ ಕೋಣೆಯಲ್ಲಿ ವಿಶ್ರಾಂತಿ ತೆಗೆಕೊಳ್ಳಿ.',
    fatigue: 'ಆಯಾಸವು ಕಳಪೆ ನಿದ್ರೆ, ರಕ್ತಹೀನತೆ ಅಥವಾ ಒತ್ತಡದಿಂದ ಬರಬಹುದು. 7-8 ಗಂಟೆ ನಿದ್ರೆ ಮತ್ತು ಸಮತೋಲಿತ ಆಹಾರ ಸೇವಿಸಿ.',
    'body pain': 'ಮೈಕೈ ನೋವು ಸಾಮಾನ್ಯವಾಗಿ ವೈರಲ್ ಕಾಯಿಲೆಯ ನಂತರ ಬರುತ್ತದೆ. ವಿಶ್ರಾಂತಿ ಮತ್ತು ನೀರು ಕುಡಿಯಿರಿ.',
    nausea: 'ವಾಕರಿಕೆ ಆಹಾರ, ಚಲನೆ ಅಥವಾ ಸೋಂಕಿನಿಂದ ಬರಬಹುದು. ಶುಂಠಿ ಚಹಾ ಸಹಾಯ ಮಾಡುತ್ತದೆ.',
    'chest pain': '⚠️ ಎದೆ ನೋವು ಗಂಭೀರವಾಗಿರಬಹುದು. ಉಸಿರಾಟದ ತೊಂದರೆ ಅಥವಾ ತೋಳು ನೋವಿದ್ದರೆ ತಕ್ಷಣ ತುರ್ತು ಸೇವೆಗಳನ್ನು ಕರೆಯಿರಿ.',
    breathlessness: '⚠️ ಉಸಿರಾಟದ ತೊಂದರೆಗೆ ತಕ್ಷಣ ಗಮನ ಬೇಕು.똑바로 ಕುಳಿತುಕೊಳ್ಳಿ, ಶಾಂತವಾಗಿರಿ ಮತ್ತು ತೀವ್ರವಾಗಿದ್ದರೆ ತುರ್ತು ಆರೈಕೆ ಪಡೆಯಿರಿ.',
  },
};

const groqClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Resilient multi-model executor for Groq chat completions.
 * Automatically tries primary high-performance models and falls back if any model is deprecated or rate-limited.
 */
const getGroqChatCompletion = async (messages) => {
  const groq = groqClient();
  const models = [
    process.env.GROQ_MODEL,
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
  ].filter(Boolean);

  let lastError;
  for (const model of models) {
    try {
      const completion = await groq.chat.completions.create({
        messages,
        model,
        max_tokens: 800,
      });
      let text = completion.choices[0]?.message?.content || '';
      // Strip reasoning/scratchpad tags if present
      text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      return text;
    } catch (err) {
      console.warn(`[AI] Groq model ${model} failed (${err.message}). Trying fallback model...`);
      lastError = err;
    }
  }
  throw lastError;
};

const checkSymptoms = async (req, res) => {
  const { symptoms, lang = 'en' } = req.body;
  if (!symptoms) return res.status(400).json({ message: 'Symptoms required' });

  const langInstruction = lang === 'kn'
    ? 'You MUST respond entirely in Kannada (ಕನ್ನಡ) language only.'
    : 'Respond in English.';

  try {
    const text = await getGroqChatCompletion([{
      role: 'user',
      content: `You are a medical assistant. ${langInstruction}
A patient reports: "${symptoms}".
Provide a brief, clear analysis: possible causes, home remedies, and when to see a doctor.
Keep it under 150 words. Do not diagnose definitively.`,
    }]);

    res.json({ response: text, source: 'groq' });
  } catch (err) {
    console.error('[AI] Groq error:', err.message);
    const lower = symptoms.toLowerCase();
    const fallback = SYMPTOM_FALLBACK[lang] || SYMPTOM_FALLBACK.en;
    const key = Object.keys(fallback).find(k => lower.includes(k));
    res.json({
      response: key ? fallback[key] : (lang === 'kn'
        ? 'ದಯವಿಟ್ಟು ಸರಿಯಾದ ಮೌಲ್ಯಮಾಪನಕ್ಕಾಗಿ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
        : 'Please consult a healthcare professional for proper evaluation.'),
      source: 'fallback',
    });
  }
};

const chatbot = async (req, res) => {
  const { message, lang = 'en' } = req.body;
  if (!message) return res.status(400).json({ message: 'Message required' });

  const langInstruction = lang === 'kn'
    ? 'You MUST respond entirely in Kannada (ಕನ್ನಡ) language only. Do not use English.'
    : 'Respond in English.';

  try {
    const text = await getGroqChatCompletion([
      {
        role: 'system',
        content: `You are a helpful healthcare assistant. ${langInstruction} Always recommend consulting a doctor for serious concerns. Keep responses under 200 words.`,
      },
      {
        role: 'user',
        content: message,
      }
    ]);

    res.json({ response: text, source: 'groq' });
  } catch (err) {
    console.error('[AI] Groq error:', err.message);
    res.json({
      response: lang === 'kn'
        ? 'ಸದ್ಯ ಸಂಪರ್ಕಿಸಲು ತೊಂದರೆ ಆಗುತ್ತಿದೆ. ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ ನಿಮ್ಮ ವೈದ್ಯರನ್ನು ಅಥವಾ ತುರ್ತು ಸೇವೆಗಳನ್ನು ಸಂಪರ್ಕಿಸಿ.'
        : "I'm having trouble connecting. Please consult your doctor or call emergency services if urgent.",
      source: 'fallback',
    });
  }
};

const summarizeReport = async (req, res) => {
  const { reportText, lang = 'en' } = req.body;
  if (!reportText) return res.status(400).json({ message: 'Report text required' });

  const langInstruction = lang === 'kn'
    ? 'You MUST respond entirely in Kannada (ಕನ್ನಡ) language only. Do not use English.'
    : 'Respond in English.';

  try {
    const text = await getGroqChatCompletion([
      {
        role: 'system',
        content: `You are an expert medical AI assistant. ${langInstruction} Your task is to analyze a doctor's prescription or medical report. Summarize what the report says in simple terms, and clearly state the next steps the patient should take (e.g., medications to take, lifestyle changes, follow-up). Keep it structured and under 250 words.`
      },
      {
        role: 'user',
        content: reportText,
      }
    ]);

    res.json({ response: text, source: 'groq' });
  } catch (err) {
    console.error('[AI] Groq error:', err.message);
    res.status(500).json({
      response: lang === 'kn' ? 'ಕ್ಷಮಿಸಿ, ವರದಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.' : 'Failed to analyze the report.',
      source: 'error'
    });
  }
};

const predictRisks = async (req, res) => {
  const { lang = 'en' } = req.body;
  try {
    const [logs] = await db.query(
      'SELECT heart_rate, steps, sleep_hours, weight, blood_pressure, notes, health_score, logged_at FROM health_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 15',
      [req.user.id]
    );

    let vitalsSummary = '';
    if (logs.length === 0) {
      vitalsSummary = 'No vitals history logged yet by this patient.';
    } else {
      vitalsSummary = logs.map(l => 
        `Date: ${l.logged_at ? new Date(l.logged_at).toISOString().split('T')[0] : 'N/A'}, HR: ${l.heart_rate || 'N/A'} bpm, Steps: ${l.steps || 'N/A'}, Sleep: ${l.sleep_hours || 'N/A'} hrs, BP: ${l.blood_pressure || 'N/A'}, Weight: ${l.weight || 'N/A'} kg`
      ).join('\n');
    }

    const langInstruction = lang === 'kn'
      ? 'You MUST respond in Kannada (ಕನ್ನಡ) language for explanations, analysis, and recommendations.'
      : 'Respond in English.';

    const text = await getGroqChatCompletion([
      {
        role: 'system',
        content: `You are an advanced medical diagnostic AI. ${langInstruction}
Analyze the patient's recent vitals history and calculate estimated risk levels (Low/Medium/High) and a numeric percentage (0% to 100%) for three health categories:
1. Cardiovascular Health Risk
2. Type-2 Diabetes Risk
3. Chronic Burnout & Fatigue Risk

Also provide:
- A brief overall summary of the active trends.
- Specific, actionable health recommendations (diet, exercise, lifestyle).

Format your output in a structured markdown format.
CRITICAL REQUIREMENT: In the "# Health Risks" section, you MUST format each line exactly as shown below with the percentage number, so the parsing system can read it:
# Health Risks
- Cardiovascular Risk: [percentage]% ([Low/Medium/High])
- Type-2 Diabetes Risk: [percentage]% ([Low/Medium/High])
- Burnout & Fatigue Risk: [percentage]% ([Low/Medium/High])

# Trend Analysis
[Provide analysis text here]

# Actionable Recommendations
[Provide recommendations list here]

Be realistic. If they have good vitals, keep the risk low. If they show sleep deficits or high HR, adjust risk upward. Include standard medical disclaimer.`
      },
      {
        role: 'user',
        content: `Patient Vitals Log History:\n${vitalsSummary}`
      }
    ]);

    res.json({ response: text, source: 'groq' });
  } catch (err) {
    console.error('[AI] Risk Predictor error:', err.message);
    res.status(500).json({
      response: lang === 'kn' ? 'ಕ್ಷಮಿಸಿ, ಅಪಾಯದ ಮುನ್ಸೂಚನೆಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.' : 'Failed to analyze risk predictions.',
      source: 'error'
    });
  }
};

const generateMealPlan = async (req, res) => {
  const { dietType, conditions, goals, lang = 'en' } = req.body;
  
  const langInstruction = lang === 'kn'
    ? 'You MUST respond entirely in Kannada (ಕನ್ನಡ) language. Outline the meal plan, items, and instructions in Kannada.'
    : 'Respond in English.';

  try {
    const text = await getGroqChatCompletion([
      {
        role: 'system',
        content: `You are an expert AI clinical dietitian. ${langInstruction}
Generate a highly personalized 1-day meal plan based on:
- Diet Type: ${dietType || 'No preference'}
- Medical Conditions: ${conditions || 'None'}
- Fitness/Health Goals: ${goals || 'Maintain healthy weight'}

Output a structured meal plan using markdown. Include:
# Daily Nutrient Summary
(Target calories, protein, carbs, fats)

# Detailed Menu
(Breakfast, Lunch, Dinner, and healthy Snacks)

# Local Alternatives
(e.g. mention ragi, millets, local greens if South Indian/Kannada context is chosen)

# Dietary Guidelines & Warnings
(Specific to the input medical conditions)

Keep the tone encouraging and professional.`
      },
      {
        role: 'user',
        content: `Generate 1-day meal plan`
      }
    ]);

    res.json({ response: text, source: 'groq' });
  } catch (err) {
    console.error('[AI] Meal Planner error:', err.message);
    res.status(500).json({
      response: lang === 'kn' ? 'ಕ್ಷಮಿಸಿ, ಆಹಾರ ಯೋಜನೆಯನ್ನು ಸಿದ್ಧಪಡಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.' : 'Failed to generate meal plan.',
      source: 'error'
    });
  }
};

const inspectDrugs = async (req, res) => {
  const { medications, lang = 'en' } = req.body;
  if (!medications) return res.status(400).json({ message: 'Medications list required' });

  const langInstruction = lang === 'kn'
    ? 'You MUST respond entirely in Kannada (ಕನ್ನಡ) language. Write all warnings and recommendations in Kannada.'
    : 'Respond in English.';

  try {
    const text = await getGroqChatCompletion([
      {
        role: 'system',
        content: `You are a medical pharmacology AI inspector. ${langInstruction}
The patient is taking the following list of medications:
"${medications}"

Analyze this list and check for:
1. **Drug-Drug Interactions**: High risk combinations that shouldn't be taken together.
2. **Scheduling Conflicts**: Overlaps (e.g. taking certain pills together that reduce absorption).
3. **Severe Side-Effect Warnings**: Potential critical side effects.
4. **Dosage & Safety Instructions**: Guidelines on how to take them safely.

Format your output in structured markdown using these exact headers:
# Hazard Level
[Specify: CRITICAL DANGER / CAUTION / SAFE]

# Interactions Checked
[Details of any interactions found]

# Schedule Guidance
[Best times to take these drugs]

# Safety Flags & Advice
[Warning guidance]

Keep it under 250 words. Always add a warning that this does not replace professional medical advice.`
      },
      {
        role: 'user',
        content: `List of Medications:\n${medications}`
      }
    ]);

    res.json({ response: text, source: 'groq' });
  } catch (err) {
    console.error('[AI] Drug Inspector error:', err.message);
    res.status(500).json({
      response: lang === 'kn' ? 'ಕ್ಷಮಿಸಿ, ಔಷಧ ತಪಾಸಣೆ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.' : 'Failed to inspect medications.',
      source: 'error'
    });
  }
};

const scanReport = async (req, res) => {
  const { lang = 'en' } = req.body;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === 'your_gemini_api_key') {
    return res.status(400).json({
      response: lang === 'kn'
        ? '⚠️ ಜೆಮಿನಿ ಎಪಿಐ ಕೀ ಕಾನ್ಫಿಗರ್ ಮಾಡಲಾಗಿಲ್ಲ. ಡಾಕ್ಯುಮೆಂಟ್ ಸ್ಕ್ಯಾನರ್ ಅನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲು ದಯವಿಟ್ಟು ಗೂಗಲ್ ಎಐ ಸ್ಟುಡಿಯೋದಿಂದ (aistudio.google.com) ಉಚಿತ ಎಪಿಐ ಕೀ ಪಡೆಯಿರಿ ಮತ್ತು ಅದನ್ನು ನಿಮ್ಮ backend/.env ಫೈಲ್‌ನಲ್ಲಿ GEMINI_API_KEY ಆಗಿ ಸೇರಿಸಿ.'
        : '⚠️ Gemini API Key not configured. Please get a free API Key from Google AI Studio (aistudio.google.com) and add it to your backend/.env as GEMINI_API_KEY to enable the document scanner.',
      source: 'error'
    });
  }

  const langInstruction = lang === 'kn'
    ? 'You MUST respond entirely in Kannada (ಕನ್ನಡ). Provide all details, tables, and summaries in Kannada.'
    : 'Respond in English.';

  const promptText = `You are an expert AI clinical OCR scanner. Read this medical prescription or lab report image. ${langInstruction}
Extract the patient name, date, list of prescribed medications (with dosages and frequencies), or key biomarker measurements (like hemoglobin, blood glucose, cholesterol, blood pressure).
For any biomarkers, specify if they are in normal reference ranges or out-of-range (high/low). Highlight out-of-range anomalies clearly.
Recommend lifestyle changes or questions to ask the doctor.
Format your response in beautiful Markdown, using clear tables for metrics. Make the output clean and professional.
Always add a disclaimer at the end that this is an AI analysis and the patient must consult their physician.`;

  const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];
  let lastError;

  for (const model of models) {
    try {
      const base64Image = req.file.buffer.toString('base64');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                { inlineData: { mimeType: req.file.mimetype, data: base64Image } }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status} from ${model}`);
      }

      const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return res.json({ response: outputText, source: 'gemini', model });
    } catch (err) {
      console.warn(`[AI] Gemini model ${model} failed: ${err.message}. Trying next fallback...`);
      lastError = err;
    }
  }

  console.error('[AI] All Gemini models failed:', lastError?.message);
  res.status(500).json({
    response: lang === 'kn'
      ? 'ವರದಿಯನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಚಿತ್ರದ ಗುಣಮಟ್ಟ ಮತ್ತು ಎಪಿಐ ಕೀಲಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.'
      : 'Failed to scan and analyze report via Gemini: ' + (lastError?.message || 'Unknown error'),
    source: 'error'
  });
};

module.exports = { checkSymptoms, chatbot, summarizeReport, predictRisks, generateMealPlan, inspectDrugs, scanReport };
