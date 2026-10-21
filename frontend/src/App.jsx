import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PatientProfile from './pages/PatientProfile';
import HealthMonitor from './pages/HealthMonitor';
import Alerts from './pages/Alerts';
import Reminders from './pages/Reminders';
import Family from './pages/Family';
import FamilyJoin from './pages/FamilyJoin';
import SymptomChecker from './pages/SymptomChecker';
import Chatbot from './pages/Chatbot';
import DoctorProfile from './pages/DoctorProfile';
import DoctorPatients from './pages/DoctorPatients';
import Appointments from './pages/Appointments';
import PPGMonitor from './pages/PPGMonitor';
import ReportAnalyser from './pages/ReportAnalyser';
import AIPredictor from './pages/AIPredictor';
import AIMealPlanner from './pages/AIMealPlanner';
import AIDrugInspector from './pages/AIDrugInspector';
import AIReportScanner from './pages/AIReportScanner';

function ProtectedLayout({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/profile" element={<ProtectedLayout><PatientProfile /></ProtectedLayout>} />
      <Route path="/health" element={<ProtectedLayout><HealthMonitor /></ProtectedLayout>} />
      <Route path="/ppg" element={<ProtectedLayout><PPGMonitor /></ProtectedLayout>} />
      <Route path="/alerts" element={<ProtectedLayout><Alerts /></ProtectedLayout>} />
      <Route path="/reminders" element={<ProtectedLayout><Reminders /></ProtectedLayout>} />
      <Route path="/family" element={<ProtectedLayout><Family /></ProtectedLayout>} />
      <Route path="/family/join/:familyId" element={<FamilyJoin />} />
      <Route path="/symptoms" element={<ProtectedLayout><SymptomChecker /></ProtectedLayout>} />
      <Route path="/chatbot" element={<ProtectedLayout><Chatbot /></ProtectedLayout>} />
      <Route path="/doctor/profile" element={<ProtectedLayout><DoctorProfile /></ProtectedLayout>} />
      <Route path="/doctor/patients" element={<ProtectedLayout><DoctorPatients /></ProtectedLayout>} />
      <Route path="/appointments" element={<ProtectedLayout><Appointments /></ProtectedLayout>} />
      <Route path="/report-analyser" element={<ProtectedLayout><ReportAnalyser /></ProtectedLayout>} />
      <Route path="/ai-predictor" element={<ProtectedLayout><AIPredictor /></ProtectedLayout>} />
      <Route path="/ai-meal-planner" element={<ProtectedLayout><AIMealPlanner /></ProtectedLayout>} />
      <Route path="/ai-drug-inspector" element={<ProtectedLayout><AIDrugInspector /></ProtectedLayout>} />
      <Route path="/report-scanner" element={<ProtectedLayout><AIReportScanner /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{ style: { fontSize: 14, borderRadius: 8 } }} />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
