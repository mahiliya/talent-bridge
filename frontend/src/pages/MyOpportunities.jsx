import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanySidebar from '../components/CompanySidebar';
import './UserDashboard.css';
import './CompanyDashboard.css';

const API_URL = 'http://localhost:3000/api';

const humanize = (value) =>
  String(value || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

function MyOpportunities() {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const meResponse = await fetch(`${API_URL}/auth/me`, { headers });
        if (!meResponse.ok) throw new Error('Your session has expired. Please log in again.');
        const meData = await meResponse.json();
        if (meData.user && !meData.company) {
          navigate('/dashboard');
          return;
        }
        if (!meData.company) throw new Error('This page is available to Company accounts only.');
        setCompany(meData.company);

        const jobsResponse = await fetch(`${API_URL}/jobs/mine`, { headers });
        if (jobsResponse.ok) setJobs(await jobsResponse.json());
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, [navigate, token]);

  const statusLabel = (job) => {
    if (job.isDraft) return 'Draft';
    return job.isActive ? 'Active' : 'Closed';
  };

  if (!company) {
    return (
      <main className="dashboard-page">
        <p className="dashboard-state">{error || 'Loading…'}</p>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <CompanySidebar active="opportunities" />
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Company workspace</p>
            <h1>My Opportunities</h1>
            <p>Select an opportunity to review and rank its applicants.</p>
          </div>
          <button type="button" className="primary-action" onClick={() => navigate('/company/post-opportunity')}>
            Post Opportunity
          </button>
        </header>

        {error && <p className="dashboard-error">{error}</p>}

        <section className="dashboard-section">
          <div className="opportunity-list">
            {jobs.length ? (
              jobs.map((job) => {
                const type = job.isInternship ? 'Internship' : humanize(job.jobType) || 'Job';
                const count = job.applicationCount ?? 0;
                const isDraft = job.isDraft;
                return (
                  <article
                    className="opportunity"
                    key={job.id}
                    role={isDraft ? undefined : 'link'}
                    tabIndex={isDraft ? undefined : 0}
                    style={{ cursor: isDraft ? 'default' : 'pointer' }}
                    onClick={() => { if (!isDraft) navigate(`/company/jobs/${job.id}/applicants`); }}
                    onKeyDown={(event) => {
                      if (!isDraft && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        navigate(`/company/jobs/${job.id}/applicants`);
                      }
                    }}
                  >
                    <div>
                      <h3>{job.title}</h3>
                      <p>
                        {type}
                        {job.location ? ` · ${job.location}` : ''}
                        {` · ${statusLabel(job)}`}
                      </p>
                    </div>
                    <span>
                      {count} application{count === 1 ? '' : 's'}
                      {isDraft ? '' : ' →'}
                    </span>
                  </article>
                );
              })
            ) : (
              <p className="empty-state">You have not posted any opportunities yet.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default MyOpportunities;
