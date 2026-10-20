import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AssessmentWizard } from './pages/AssessmentWizard';
import { ResultsDashboard } from './pages/ResultsDashboard';
import { AssessmentHistoryPage } from './pages/AssessmentHistoryPage';
import { PlanComparisonPage } from './pages/PlanComparisonPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { AdminDashboard } from './pages/AdminDashboard';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        {/* Top Disclaimer Notification */}
        <DisclaimerBanner variant="banner" />

        {/* Global Navigation */}
        <Navbar />

        {/* Main Routed Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/assessment" element={<AssessmentWizard />} />
            <Route path="/results/:id" element={<ResultsDashboard />} />
            <Route path="/history" element={<AssessmentHistoryPage />} />
            <Route path="/compare" element={<PlanComparisonPage />} />
            <Route path="/model-performance" element={<ModelPerformancePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </Router>
  );
};

export default App;
