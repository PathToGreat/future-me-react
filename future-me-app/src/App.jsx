import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import BetaAgreement from './components/BetaAgreement';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/auth" />;
}

function AppRoutes() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const getAuthRedirect = () => {
    if (!user) return <AuthScreen />;
    if (!userProfile?.hasAcceptedBetaTerms) return <Navigate to="/beta-agreement" />;
    if (!userProfile?.onboardingCompleted) return <Navigate to="/onboarding" />;
    return <Navigate to="/dashboard" />;
  };

  const getBetaAgreementElement = () => {
    if (!user) return <Navigate to="/auth" />;
    if (userProfile?.hasAcceptedBetaTerms) {
      if (userProfile?.onboardingCompleted) return <Navigate to="/dashboard" />;
      return <Navigate to="/onboarding" />;
    }
    return <BetaAgreement />;
  };

  const getOnboardingElement = () => {
    if (!user) return <Navigate to="/auth" />;
    if (!userProfile?.hasAcceptedBetaTerms) return <Navigate to="/beta-agreement" />;
    return <Onboarding />;
  };

  const getDashboardElement = () => {
    if (!user) return <Navigate to="/auth" />;
    if (!userProfile?.hasAcceptedBetaTerms) return <Navigate to="/beta-agreement" />;
    if (!userProfile?.onboardingCompleted) return <Navigate to="/onboarding" />;
    return <Dashboard />;
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={getAuthRedirect()} />
      <Route path="/beta-agreement" element={getBetaAgreementElement()} />
      <Route path="/onboarding" element={getOnboardingElement()} />
      <Route path="/dashboard" element={getDashboardElement()} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
