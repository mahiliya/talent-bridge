import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CompanySidebar from '../components/CompanySidebar';
import './UserDashboard.css';
import './CompanyDashboard.css';
import './CompanyApplicants.css';

const API_URL = 'http://localhost:3000/api';

const humanize = (value) =>
  String(value || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const scoreClass = (score) => (score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low');

function JobApplicants() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [company, setCompany] = useState(null);
  const [data, setData] = useState(null); // { job, applicants }
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

        const res = await fetch(`${API_URL}/applications/jobs/${jobId}`, { headers });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Unable to load applicants for this opportunity.');
        setData(body);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, [navigate, token, jobId]);

  if (!company || (!data && !error)) {
    return (
      <main className="dashboard-page">
        <p className="dashboard-state">{error || 'Loading applicants…'}</p>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <CompanySidebar active="opportunities" />
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Applicants{data?.job ? ` · ${humanize(data.job.jobType)}` : ''}</p>
            <h1>{data?.job?.title || 'Applicants'}</h1>
            <p>Ranked by how well each applicant matches this opportunity.</p>
          </div>
          <button type="button" className="text-link" onClick={() => navigate('/company/opportunities')}>← My Opportunities</button>
        </header>

        {error && <p className="dashboard-error">{error}</p>}

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Ranked by match</p>
              <h2>Applicants</h2>
            </div>
            <span className="section-count">{data?.applicants?.length || 0}</span>
          </div>

          <div className="applicant-list">
            {data?.applicants?.length ? (
              data.applicants.map((row) => (
                <article
                  className="applicant-row"
                  key={row.applicationId}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/company/applications/${row.applicationId}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/company/applications/${row.applicationId}`);
                    }
                  }}
                >
                  <div className={`match-badge ${scoreClass(row.matchScore)}`}>
                    <strong>{row.matchScore}%</strong>
                    <span>match</span>
                  </div>
                  <div className="applicant-main">
                    <h3>{row.applicant.fullName}</h3>
                    <p>
                      {[row.applicant.fieldOfStudy, row.applicant.university].filter(Boolean).join(' · ') || 'No education details'}
                    </p>
                    {row.applicant.skills?.length ? (
                      <div className="skill-chips">
                        {row.applicant.skills.slice(0, 6).map((s) => (
                          <span className="skill-chip" key={s}>{s}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <span className={`status status-${String(row.status || 'PENDING').toLowerCase()}`}>
                    {humanize(row.status || 'PENDING')}
                  </span>
                  <span className="applicant-action" aria-hidden="true">View Details →</span>
                </article>
              ))
            ) : (
              <p className="empty-state">No one has applied to this opportunity yet.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default JobApplicants;
