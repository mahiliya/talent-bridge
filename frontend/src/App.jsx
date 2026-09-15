import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import CategorySection from './components/CategorySection';
import ExploreCta from './components/ExploreCta';
import PartnerSection from './components/PartnerSection';
import Footer from './components/Footer';
import InternshipsPage from './pages/InternshipsPage'; // Import the InternshipsPage
import InternshipDetailsPage from './pages/InternshipDetailsPage'; // Import the InternshipDetailsPage
import AboutUs from './components/AboutUs';
import UserDashboard from './pages/UserDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import PostOpportunity from './pages/PostOpportunity';
import MyOpportunities from './pages/MyOpportunities';
import JobApplicants from './pages/JobApplicants';
import ApplicationDetails from './pages/ApplicationDetails';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <Routes>
          {/* Public landing + auth pages. Home is public-only: an authenticated
              visitor is redirected to their dashboard (the authenticated home). */}
          <Route path="/" element={
            <PublicOnlyRoute>
              <>
                <Hero />
                <HowItWorks />
                <CategorySection />
                <ExploreCta />
                <PartnerSection />
              </>
            </PublicOnlyRoute>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/about" element={<AboutUs />} />

          {/* Opportunity browsing — authentication required. An unauthenticated
              visitor is sent to /login and returned to the requested page after
              signing in. */}
          <Route path="/internships" element={<ProtectedRoute><InternshipsPage /></ProtectedRoute>} />
          <Route path="/internships/:id" element={<ProtectedRoute><InternshipDetailsPage /></ProtectedRoute>} />
          <Route path="/category/:category" element={<ProtectedRoute><InternshipsPage /></ProtectedRoute>} />

          {/* User dashboard — authentication required (never reachable while
              logged out). */}
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />

          {/* Company workspace — authentication required. */}
          <Route path="/company/dashboard" element={<ProtectedRoute><CompanyDashboard /></ProtectedRoute>} />
          <Route path="/company/post-opportunity" element={<ProtectedRoute><PostOpportunity /></ProtectedRoute>} />
          <Route path="/company/jobs/:jobId/edit" element={<ProtectedRoute><PostOpportunity /></ProtectedRoute>} />
          <Route path="/company/opportunities" element={<ProtectedRoute><MyOpportunities /></ProtectedRoute>} />
          <Route path="/company/jobs/:jobId/applicants" element={<ProtectedRoute><JobApplicants /></ProtectedRoute>} />
          <Route path="/company/applications/:applicationId" element={<ProtectedRoute><ApplicationDetails /></ProtectedRoute>} />
        </Routes>
        <Footer />
        <main>
          {/* We will add the rest of the page content here later */}
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
