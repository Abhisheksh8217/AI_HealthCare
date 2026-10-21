import { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    // Nav
    dashboard: 'Dashboard', myProfile: 'My Profile', healthMonitor: 'Health Monitor',
    alerts: 'Alerts', appointments: 'Appointments', reminders: 'Reminders',
    family: 'Family', symptomChecker: 'Symptom Checker', healthChatbot: 'Health Chatbot',
    doctorProfile: 'Doctor Profile', patients: 'Patients', ppgMonitor: 'PPG Heart Rate',
    aiPredictor: 'Vitals Risk Predictor', aiMealPlanner: 'Smart Diet Planner',
    aiDrugInspector: 'Prescription Inspector', aiSuiteTitle: 'AI Advanced Labs',
    // Dashboard
    goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening',
    healthOverview: "Here's your health overview for today",
    heartRate: 'Heart Rate (bpm)', stepsToday: 'Steps Today', sleepHours: 'Sleep Hours',
    activeAlerts: 'Active Alerts', healthScore: 'Health Score', recentAlerts: 'Recent Alerts',
    noActiveAlerts: 'No active alerts', heartRateTrend: 'Heart Rate Trend',
    basedOnLatest: 'Based on your latest health data', logDataFirst: 'Log health data to see your score',
    // Health Monitor
    logHealthData: 'Log Health Data', trackMetrics: 'Track and analyze your daily health metrics',
    logTodayData: "Log Today's Health Data", steps: 'Steps', sleepHoursLabel: 'Sleep Hours',
    weight: 'Weight (kg)', bloodPressure: 'Blood Pressure', notes: 'Notes', saveEntry: 'Save Entry',
    cancel: 'Cancel', healthTrends: 'Health Trends (Last 14 days)', healthHistory: 'Health History',
    noHealthData: 'No health data logged yet', date: 'Date', score: 'Score',
    // PPG
    ppgTitle: 'PPG Heart Rate Monitor', ppgSubtitle: 'Measure heart rate using your camera',
    startMeasurement: 'Start Measurement', stopMeasurement: 'Stop Measurement',
    measuring: 'Measuring...', placeFingerTip: 'Place fingertip over camera lens & cover flash',
    ppgInstructions: 'Keep still for 10 seconds for accurate reading',
    detectedHR: 'Detected Heart Rate', saveToHealth: 'Save to Health Log', ppgResult: 'Result',
    // Reminders
    remindersTitle: 'Reminders', remindersSubtitle: 'Manage your medicine and health reminders',
    addReminder: 'Add Reminder', quickPresets: 'Quick Presets', newReminder: 'New Reminder',
    title: 'Title', type: 'Type', time: 'Time', frequency: 'Frequency', description: 'Description',
    whatsappPhone: 'WhatsApp Phone (for notifications)', saveReminder: 'Save Reminder',
    myReminders: 'My Reminders', noReminders: 'No reminders set yet', actions: 'Actions',
    medicine: 'Medicine', checkup: 'Checkup', habit: 'Habit', other: 'Other',
    daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', once: 'Once',
    // Alerts
    healthAlerts: 'Health Alerts', alertsSubtitle: 'Auto-generated alerts based on your health data',
    activeAlertsTitle: 'Active Alerts', resolvedAlerts: 'Resolved Alerts', markRead: 'Mark Read',
    noAlerts: "No alerts — you're doing great!",
    // Auth
    signIn: 'Sign in to your account', enterCredentials: 'Enter your credentials to continue',
    emailAddress: 'Email address', password: 'Password', signInBtn: 'Sign In',
    noAccount: "Don't have an account?", createOne: 'Create one',
    createAccount: 'Create your account', chooseRole: 'Choose your role to get started',
    fullName: 'Full Name', phone: 'Phone', alreadyHave: 'Already have an account?',
    // Common
    save: 'Save', delete: 'Delete', edit: 'Edit', view: 'View', search: 'Search',
    loading: 'Loading...', welcomeBack: 'Welcome back',
    language: 'Language', selectLanguage: 'Select Language',
    // AI
    Fever: 'Fever', Cough: 'Cough', Headache: 'Headache', Fatigue: 'Fatigue', 'Body Pain': 'Body Pain',
    Nausea: 'Nausea', 'Chest Pain': 'Chest Pain', Breathlessness: 'Breathlessness',
    'What foods are good for heart health?': 'What foods are good for heart health?',
    'How much water should I drink daily?': 'How much water should I drink daily?',
    'What are signs of high blood pressure?': 'What are signs of high blood pressure?',
    'How can I improve my sleep quality?': 'How can I improve my sleep quality?',
  },
  kn: {
    // Nav
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', myProfile: 'ನನ್ನ ಪ್ರೊಫೈಲ್', healthMonitor: 'ಆರೋಗ್ಯ ಮಾನಿಟರ್',
    alerts: 'ಎಚ್ಚರಿಕೆಗಳು', appointments: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು', reminders: 'ಜ್ಞಾಪನೆಗಳು',
    family: 'ಕುಟುಂಬ', symptomChecker: 'ರೋಗಲಕ್ಷಣ ಪರೀಕ್ಷಕ', healthChatbot: 'ಆರೋಗ್ಯ ಚಾಟ್‌ಬಾಟ್',
    doctorProfile: 'ವೈದ್ಯರ ಪ್ರೊಫೈಲ್', patients: 'ರೋಗಿಗಳು', ppgMonitor: 'PPG ಹೃದಯ ಬಡಿತ',
    aiPredictor: 'ಆರೋಗ್ಯ ಅಪಾಯ ಮುನ್ಸೂಚಕ', aiMealPlanner: 'ಸ್ಮಾರ್ಟ್ ಆಹಾರ ಯೋಜನೆ',
    aiDrugInspector: 'ಔಷಧ ತಪಾಸಕ', aiSuiteTitle: 'AI ಸುಧಾರಿತ ಪ್ರಯೋಗಾಲಯ',
    // Dashboard
    goodMorning: 'ಶುಭ ಬೆಳಗು', goodAfternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ', goodEvening: 'ಶುಭ ಸಂಜೆ',
    healthOverview: 'ಇಂದಿನ ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಾರಾಂಶ',
    heartRate: 'ಹೃದಯ ಬಡಿತ (bpm)', stepsToday: 'ಇಂದಿನ ಹೆಜ್ಜೆಗಳು', sleepHours: 'ನಿದ್ರೆ ಗಂಟೆಗಳು',
    activeAlerts: 'ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು', healthScore: 'ಆರೋಗ್ಯ ಸ್ಕೋರ್', recentAlerts: 'ಇತ್ತೀಚಿನ ಎಚ್ಚರಿಕೆಗಳು',
    noActiveAlerts: 'ಯಾವುದೇ ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ', heartRateTrend: 'ಹೃದಯ ಬಡಿತ ಪ್ರವೃತ್ತಿ',
    basedOnLatest: 'ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಆರೋಗ್ಯ ಡೇಟಾ ಆಧಾರಿತ', logDataFirst: 'ಸ್ಕೋರ್ ನೋಡಲು ಆರೋಗ್ಯ ಡೇಟಾ ದಾಖಲಿಸಿ',
    // Health Monitor
    logHealthData: 'ಆರೋಗ್ಯ ಡೇಟಾ ದಾಖಲಿಸಿ', trackMetrics: 'ನಿಮ್ಮ ದೈನಂದಿನ ಆರೋಗ್ಯ ಮೆಟ್ರಿಕ್‌ಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    logTodayData: 'ಇಂದಿನ ಆರೋಗ್ಯ ಡೇಟಾ ದಾಖಲಿಸಿ', steps: 'ಹೆಜ್ಜೆಗಳು', sleepHoursLabel: 'ನಿದ್ರೆ ಗಂಟೆಗಳು',
    weight: 'ತೂಕ (ಕೆಜಿ)', bloodPressure: 'ರಕ್ತದೊತ್ತಡ', notes: 'ಟಿಪ್ಪಣಿಗಳು', saveEntry: 'ನಮೂದು ಉಳಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ', healthTrends: 'ಆರೋಗ್ಯ ಪ್ರವೃತ್ತಿಗಳು (ಕಳೆದ 14 ದಿನಗಳು)', healthHistory: 'ಆರೋಗ್ಯ ಇತಿಹಾಸ',
    noHealthData: 'ಇನ್ನೂ ಯಾವುದೇ ಆರೋಗ್ಯ ಡೇಟಾ ದಾಖಲಿಸಿಲ್ಲ', date: 'ದಿನಾಂಕ', score: 'ಸ್ಕೋರ್',
    // PPG
    ppgTitle: 'PPG ಹೃದಯ ಬಡಿತ ಮಾನಿಟರ್', ppgSubtitle: 'ಕ್ಯಾಮೆರಾ ಬಳಸಿ ಹೃದಯ ಬಡಿತ ಅಳೆಯಿರಿ',
    startMeasurement: 'ಅಳತೆ ಪ್ರಾರಂಭಿಸಿ', stopMeasurement: 'ಅಳತೆ ನಿಲ್ಲಿಸಿ',
    measuring: 'ಅಳೆಯುತ್ತಿದೆ...', placeFingerTip: 'ಬೆರಳ ತುದಿಯನ್ನು ಕ್ಯಾಮೆರಾ ಮೇಲೆ ಇರಿಸಿ ಮತ್ತು ಫ್ಲ್ಯಾಶ್ ಮುಚ್ಚಿ',
    ppgInstructions: 'ನಿಖರ ಓದುವಿಕೆಗಾಗಿ 10 ಸೆಕೆಂಡ್ ಸ್ಥಿರವಾಗಿರಿ',
    detectedHR: 'ಪತ್ತೆಯಾದ ಹೃದಯ ಬಡಿತ', saveToHealth: 'ಆರೋಗ್ಯ ಲಾಗ್‌ಗೆ ಉಳಿಸಿ', ppgResult: 'ಫಲಿತಾಂಶ',
    // Reminders
    remindersTitle: 'ಜ್ಞಾಪನೆಗಳು', remindersSubtitle: 'ನಿಮ್ಮ ಔಷಧ ಮತ್ತು ಆರೋಗ್ಯ ಜ್ಞಾಪನೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
    addReminder: 'ಜ್ಞಾಪನೆ ಸೇರಿಸಿ', quickPresets: 'ತ್ವರಿತ ಪ್ರಿಸೆಟ್‌ಗಳು', newReminder: 'ಹೊಸ ಜ್ಞಾಪನೆ',
    title: 'ಶೀರ್ಷಿಕೆ', type: 'ಪ್ರಕಾರ', time: 'ಸಮಯ', frequency: 'ಆವರ್ತನ', description: 'ವಿವರಣೆ',
    whatsappPhone: 'WhatsApp ಫೋನ್ (ಅಧಿಸೂಚನೆಗಳಿಗಾಗಿ)', saveReminder: 'ಜ್ಞಾಪನೆ ಉಳಿಸಿ',
    myReminders: 'ನನ್ನ ಜ್ಞಾಪನೆಗಳು', noReminders: 'ಇನ್ನೂ ಯಾವುದೇ ಜ್ಞಾಪನೆಗಳಿಲ್ಲ', actions: 'ಕ್ರಿಯೆಗಳು',
    medicine: 'ಔಷಧ', checkup: 'ತಪಾಸಣೆ', habit: 'ಅಭ್ಯಾಸ', other: 'ಇತರ',
    daily: 'ದೈನಂದಿನ', weekly: 'ಸಾಪ್ತಾಹಿಕ', monthly: 'ಮಾಸಿಕ', once: 'ಒಮ್ಮೆ',
    // Alerts
    healthAlerts: 'ಆರೋಗ್ಯ ಎಚ್ಚರಿಕೆಗಳು', alertsSubtitle: 'ಆರೋಗ್ಯ ಡೇಟಾ ಆಧಾರಿತ ಸ್ವಯಂ ಎಚ್ಚರಿಕೆಗಳು',
    activeAlertsTitle: 'ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು', resolvedAlerts: 'ಪರಿಹರಿಸಿದ ಎಚ್ಚರಿಕೆಗಳು', markRead: 'ಓದಿದಂತೆ ಗುರುತಿಸಿ',
    noAlerts: 'ಯಾವುದೇ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ — ನೀವು ಚೆನ್ನಾಗಿದ್ದೀರಿ!',
    // Auth
    signIn: 'ನಿಮ್ಮ ಖಾತೆಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ', enterCredentials: 'ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ರುಜುವಾತುಗಳನ್ನು ನಮೂದಿಸಿ',
    emailAddress: 'ಇಮೇಲ್ ವಿಳಾಸ', password: 'ಪಾಸ್‌ವರ್ಡ್', signInBtn: 'ಸೈನ್ ಇನ್',
    noAccount: 'ಖಾತೆ ಇಲ್ಲವೇ?', createOne: 'ಒಂದನ್ನು ರಚಿಸಿ',
    createAccount: 'ನಿಮ್ಮ ಖಾತೆ ರಚಿಸಿ', chooseRole: 'ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ಪಾತ್ರ ಆಯ್ಕೆಮಾಡಿ',
    fullName: 'ಪೂರ್ಣ ಹೆಸರು', phone: 'ಫೋನ್', alreadyHave: 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?',
    // Common
    save: 'ಉಳಿಸಿ', delete: 'ಅಳಿಸಿ', edit: 'ಸಂಪಾದಿಸಿ', view: 'ವೀಕ್ಷಿಸಿ', search: 'ಹುಡುಕಿ',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...', welcomeBack: 'ಮರಳಿ ಸ್ವಾಗತ',
    language: 'ಭಾಷೆ', selectLanguage: 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
    // AI
    Fever: 'ಜ್ವರ', Cough: 'ಕೆಮ್ಮು', Headache: 'ತಲೆನೋವು', Fatigue: 'ಆಯಾಸ', 'Body Pain': 'ಮೈಕೈ ನೋವು',
    Nausea: 'ವಾಕರಿಕೆ', 'Chest Pain': 'ಎದೆ ನೋವು', Breathlessness: 'ಉಸಿರಾಟದ ತೊಂದರೆ',
    'What foods are good for heart health?': 'ಹೃದಯದ ಆರೋಗ್ಯಕ್ಕೆ ಯಾವ ಆಹಾರಗಳು ಒಳ್ಳೆಯದು?',
    'How much water should I drink daily?': 'ನಾನು ಪ್ರತಿದಿನ ಎಷ್ಟು ನೀರು ಕುಡಿಯಬೇಕು?',
    'What are signs of high blood pressure?': 'ಅಧಿಕ ರಕ್ತದೊತ್ತಡದ ಲಕ್ಷಣಗಳು ಯಾವುವು?',
    'How can I improve my sleep quality?': 'ನನ್ನ ನಿದ್ರೆಯ ಗುಣಮಟ್ಟವನ್ನು ನಾನು ಹೇಗೆ ಸುಧಾರಿಸಬಹುದು?',
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  const switchLang = (l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
