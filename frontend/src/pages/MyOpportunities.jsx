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
  const [busyId, setBusyId] = useState(null);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!token) {
      navigate('/login');
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

  // Replace a single job in local state after a status change so the UI updates
  // without a full reload. Preserves the applicationCount the list relies on.
  const mergeJob = (updated) =>
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j)));

  // Deactivate / re-activate a published opportunity (owner-only, enforced by
  // the backend). Drafts must be published first, so they use `publish` below.
  const toggleActive = async (job) => {
    setError('');
    setBusyId(job.id);
    try {
      const res = await fetch(`${API_URL}/jobs/${job.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not update this opportunity.');
      mergeJob(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const publish = async (job) => {
    setError('');
    setBusyId(job.id);
    try {
      const res = await fetch(`${API_URL}/jobs/${job.id}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not publish this opportunity.');
      mergeJob(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
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
            <p>View, edit, manage applicants, and open or close each opportunity.</p>
          </div>
          <button type="button" className="primary-action" onClick={() => navigate('/company/post-opportunity')}>
            Post Opportunity
          </button>
        </header>

        {error && <p className="dashboard-error">{error}</p>}

        <section className="dashboard-section">
          <div className="job-card-list">
            {jobs.length ? (
              jobs.map((job) => {
                const type = job.isInternship ? 'Internship' : humanize(job.jobType) || 'Job';
                const count = job.applicationCount ?? 0;
                const busy = busyId === job.id;
                return (
                  <article className="job-card" key={job.id}>
                    <div className="job-card-main">
                      <div className="job-card-heading">
                        <h3>{job.title}</h3>
                        <span className={`job-state job-state-${statusLabel(job).toLowerCase()}`}>
                          {statusLabel(job)}
                        </span>
                      </div>
                      <p className="job-card-meta">
                        {type}
                        {job.location ? ` · ${job.location}` : ''}
                        {job.workMode ? ` · ${humanize(job.workMode)}` : ''}
                        {` · ${count} application${count === 1 ? '' : 's'}`}
                        {job.deadline ? ` · Closes ${new Date(job.deadline).toLocaleDateString()}` : ''}
                      </p>
                    </div>

                    <div className="job-actions">
                      <button
                        type="button"
                        className="job-action"
                        onClick={() => navigate(`/internships/${job.id}`)}
                      >
                        View Job
                      </button>
                      <button
                        type="button"
                        className="job-action"
                        onClick={() => navigate(`/company/jobs/${job.id}/edit`)}
                      >
                        Edit Job
                      </button>
                      <button
                        type="button"
                        className="job-action"
                        onClick={() => navigate(`/company/jobs/${job.id}/applicants`)}
                      >
                        View Applications
                      </button>
                      {job.isDraft ? (
                        <button
                          type="button"
                          className="job-action job-action-primary"
                          disabled={busy}
                          onClick={() => publish(job)}
                        >
                          {busy ? 'Working…' : 'Publish'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`job-action ${job.isActive ? 'job-action-danger' : 'job-action-primary'}`}
                          disabled={busy}
                          onClick={() => toggleActive(job)}
                        >
                          {busy ? 'Working…' : job.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
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
