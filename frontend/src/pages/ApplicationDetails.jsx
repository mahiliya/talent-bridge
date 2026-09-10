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

// UI action -> real ApplicationStatus enum value.
const ACTIONS = [
  { label: 'Shortlist', status: 'SHORTLISTED' },
  { label: 'Accept', status: 'ACCEPTED' },
  { label: 'Reject', status: 'REJECTED' },
];

function ApplicationDetails() {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

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

        const res = await fetch(`${API_URL}/applications/${applicationId}`, { headers });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Unable to load this application.');
        setApplication(body);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, [navigate, token, applicationId]);

  const updateStatus = async (status) => {
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const res = await fetch(`${API_URL}/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not update the status.');
      // Reflect the persisted status immediately.
      setApplication((prev) => ({ ...prev, status: body.status || status }));
      setNotice(`Status updated to ${humanize(body.status || status)}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!application) {
    return (
      <main className="dashboard-page">
        <p className="dashboard-state">{error || 'Loading application…'}</p>
      </main>
    );
  }

  const a = application.applicant || {};
  const job = application.job || {};
  const portfolio = [
    { label: 'Portfolio', url: a.portfolioWebsite },
    { label: 'GitHub', url: a.githubProfile },
    { label: 'LinkedIn', url: a.linkedInProfile },
  ].filter((p) => p.url);
  const resumeUrl = application.resumeUrl || a.resume;
  const breakdown = application.matchBreakdown || [];

  return (
    <main className="dashboard-page">
      <CompanySidebar active="opportunities" />
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Application · {job.title || 'Opportunity'}</p>
            <h1>{a.fullName || 'Applicant'}</h1>
            <p>
              Applied {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : '—'}
              {' · '}
              <span className={`status status-${String(application.status || 'PENDING').toLowerCase()}`}>
                {humanize(application.status || 'PENDING')}
              </span>
            </p>
          </div>
          {job.id && (
            <button type="button" className="text-link" onClick={() => navigate(`/company/jobs/${job.id}/applicants`)}>
              ← Applicants
            </button>
          )}
        </header>

        {error && <p className="dashboard-error">{error}</p>}
        {notice && <p className="profile-saved">{notice}</p>}

        {/* Decision actions */}
        <section className="decision-bar">
          {ACTIONS.map((action) => (
            <button
              key={action.status}
              type="button"
              className={`decision-btn decision-${action.status.toLowerCase()} ${application.status === action.status ? 'current' : ''}`}
              disabled={saving || application.status === action.status}
              onClick={() => updateStatus(action.status)}
            >
              {application.status === action.status ? `${action.label}ed` : action.label}
            </button>
          ))}
        </section>

        <div className="detail-grid">
          {/* Match breakdown */}
          <article className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Why this score</p>
                <h2>Match breakdown</h2>
              </div>
              <span className={`match-badge inline ${scoreClass(application.matchScore || 0)}`}>
                <strong>{application.matchScore ?? 0}%</strong>
              </span>
            </div>
            <ul className="breakdown-list">
              {breakdown.map((item) => (
                <li key={item.key} className={item.applicable ? '' : 'na'}>
                  <div className="breakdown-head">
                    <span>{item.label}</span>
                    <span>{item.applicable ? `${item.earned}/${item.max}` : 'N/A'}</span>
                  </div>
                  {item.applicable && (
                    <div className="breakdown-track">
                      <div style={{ width: `${item.max ? (item.earned / item.max) * 100 : 0}%` }} />
                    </div>
                  )}
                  <p className="breakdown-detail">{item.detail}</p>
                </li>
              ))}
            </ul>
            <p className="breakdown-note">Score = earned ÷ applicable weight. “N/A” criteria are excluded so no false points are awarded.</p>
          </article>

          {/* Applicant profile */}
          <article className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Candidate</p>
                <h2>Profile</h2>
              </div>
            </div>
            <dl className="profile-facts">
              <div><dt>Email</dt><dd>{a.email || '—'}</dd></div>
              <div><dt>Field of study</dt><dd>{a.fieldOfStudy || '—'}</dd></div>
              <div><dt>University</dt><dd>{a.university || '—'}</dd></div>
              <div><dt>Degree</dt><dd>{a.degree || '—'}</dd></div>
              <div><dt>Status</dt><dd>{a.isStudent ? 'Student' : a.isGraduate ? 'Graduate' : '—'}</dd></div>
            </dl>

            <p className="eyebrow" style={{ marginTop: '18px' }}>Skills</p>
            {a.skills?.length ? (
              <div className="skill-chips">
                {a.skills.map((s) => <span className="skill-chip" key={s}>{s}</span>)}
              </div>
            ) : <p className="empty-state">No skills listed.</p>}

            <p className="eyebrow" style={{ marginTop: '18px' }}>Documents & links</p>
            <div className="doc-links">
              {resumeUrl
                ? <a className="doc-link" href={resumeUrl} target="_blank" rel="noopener noreferrer">View résumé</a>
                : <span className="empty-state">No résumé uploaded.</span>}
              {portfolio.map((p) => (
                <a className="doc-link" key={p.label} href={p.url} target="_blank" rel="noopener noreferrer">{p.label}</a>
              ))}
            </div>
          </article>
        </div>

        {/* Cover letter */}
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">In their words</p>
              <h2>Cover letter</h2>
            </div>
          </div>
          {application.coverLetter
            ? <p className="cover-letter">{application.coverLetter}</p>
            : <p className="empty-state">No cover letter was submitted.</p>}
        </section>
      </section>
    </main>
  );
}

export default ApplicationDetails;
