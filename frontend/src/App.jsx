import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import CompaniesWeHelped from './components/CompaniesWeHelped';
import CategorySection from './components/CategorySection';
import InternshipSection from './components/InternshipSection';
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

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <CompaniesWeHelped />
              <CategorySection />
              <InternshipSection />
            </>
          } />
          <Route path="/internships" element={<InternshipsPage />} />
          <Route path="/internships/:id" element={<InternshipDetailsPage />} /> { /* New Route */}
          <Route path="/about" element={<AboutUs />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/company/post-opportunity" element={<PostOpportunity />} />
          <Route path="/company/opportunities" element={<MyOpportunities />} />
          <Route path="/company/jobs/:jobId/applicants" element={<JobApplicants />} />
          <Route path="/company/applications/:applicationId" element={<ApplicationDetails />} />
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