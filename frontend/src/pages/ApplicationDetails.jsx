import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CompanySidebar from '../components/CompanySidebar';
import { capitalizeFirst } from '../utils/capitalize';
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

// Treat a stored link as an external URL. If it lacks a scheme, assume https so
// the browser opens it as an external site rather than a local route.
const normalizeUrl = (url) => {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

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
  // The explanation/message the company sends to the applicant with a decision.
  // Prefilled with any previously saved message so it can be reviewed/edited.
  const [reason, setReason] = useState('');

  const MAX_REASON = 1000;

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

        const res = await fetch(`${API_URL}/applications/${applicationId}`, { headers });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Unable to load this application.');
        setApplication(body);
        setReason(body.notes || '');
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, [navigate, token, applicationId]);

  // Open the applicant's resume through the authorized backend endpoint. We
  // fetch it with the auth token (so the resume stays private), turn the PDF
  // into an object URL, and open that URL via a real anchor navigation.
  //
  // We deliberately do NOT pre-open a blank window and assign win.location to a
  // blob: URL — some browsers land the empty tab on the New Tab Page and then
  // treat the blob string as a search query (opening a Google search page).
  // A programmatic <a target="_blank"> click navigates directly to the blob and
  // the browser's built-in PDF viewer renders it.
  const viewResume = async () => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/applications/${applicationId}/resume`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to open the resume.');
      }
      const blob = await res.blob();
      // Ensure the object URL is typed as a PDF so it renders inline.
      const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Release the object URL once the new tab has had time to load it.
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(err.message || 'Unable to open the resume.');
    }
  };

  const updateStatus = async (status) => {
    setNotice('');
    setError('');

    // Require a short explanation so the applicant always receives a reason with
    // their decision. Trimmed and length-checked before we hit the API (the
    // backend enforces the same limit).
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Please add a reason / message to the applicant before updating the status.');
      return;
    }
    if (trimmedReason.length > MAX_REASON) {
      setError(`The message must be ${MAX_REASON} characters or fewer.`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, reason: trimmedReason }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not update the status.');
      // Reflect the persisted status + saved message immediately.
      setApplication((prev) => ({ ...prev, status: body.status || status, notes: body.notes ?? trimmedReason }));
      setReason(body.notes ?? trimmedReason);
      setNotice(`Status updated to ${humanize(body.status || status)}. The applicant has been notified.`);
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
  // Additional professional links (kept separate from the primary portfolio).
  const extraLinks = [
    { label: 'GitHub', url: a.githubProfile },
    { label: 'LinkedIn', url: a.linkedInProfile },
  ].filter((p) => p.url);
  const portfolioUrl = a.portfolioWebsite;
  // A resume exists if either the application or the applicant profile has one.
  const hasResume = Boolean(application.resumeUrl || a.resume);
  const preferredLocations = a.preferredLocations?.length ? a.preferredLocations.join(', ') : '';
  const academicStatus = a.isStudent ? 'Student' : a.isGraduate ? 'Graduate' : '';
  const expectedGraduation = a.expectedGraduation ? new Date(a.expectedGraduation).toLocaleDateString() : '';
  const breakdown = application.matchBreakdown || [];
  const statusBadge = (
    <span className={`status status-${String(application.status || 'PENDING').toLowerCase()}`}>
      {humanize(application.status || 'PENDING')}
    </span>
  );

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
              {statusBadge}
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

        {/* 1. Applicant Profile — the applicant's stored profile, retrieved via
            the User relation (not duplicated on the application). Contact details
            (email + phone) let the company reach an accepted candidate. */}
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Candidate</p>
              <h2>Applicant Profile</h2>
            </div>
          </div>
          <article className="dashboard-panel">
            <dl className="profile-facts">
              <div><dt>Full name</dt><dd>{a.fullName || '—'}</dd></div>
              <div><dt>Email</dt><dd>{a.email ? <a className="text-link" href={`mailto:${a.email}`}>{a.email}</a> : '—'}</dd></div>
              <div><dt>Phone</dt><dd>{a.phoneNumber ? <a className="text-link" href={`tel:${a.phoneNumber}`}>{a.phoneNumber}</a> : '—'}</dd></div>
              <div><dt>Education</dt><dd>{a.university || '—'}</dd></div>
              <div><dt>Field of study</dt><dd>{a.fieldOfStudy || '—'}</dd></div>
              <div><dt>Degree</dt><dd>{a.degree || '—'}</dd></div>
              <div><dt>Academic status</dt><dd>{academicStatus || '—'}</dd></div>
              {expectedGraduation && <div><dt>Expected graduation</dt><dd>{expectedGraduation}</dd></div>}
              <div><dt>Preferred locations</dt><dd>{preferredLocations || '—'}</dd></div>
            </dl>

            <p className="eyebrow" style={{ marginTop: '18px' }}>Skills</p>
            {a.skills?.length ? (
              <div className="skill-chips">
                {a.skills.map((s) => <span className="skill-chip" key={s}>{s}</span>)}
              </div>
            ) : <p className="empty-state">No skills listed.</p>}

            <p className="eyebrow" style={{ marginTop: '18px' }}>Resume</p>
            <div className="doc-links">
              {hasResume
                ? <button type="button" className="doc-link" onClick={viewResume}>View Resume</button>
                : <span className="empty-state">No resume uploaded.</span>}
            </div>

            <p className="eyebrow" style={{ marginTop: '18px' }}>Portfolio</p>
            <div className="doc-links">
              {portfolioUrl
                ? <a className="doc-link" href={normalizeUrl(portfolioUrl)} target="_blank" rel="noopener noreferrer">View Portfolio</a>
                : <span className="empty-state">No portfolio provided</span>}
              {extraLinks.map((p) => (
                <a className="doc-link" key={p.label} href={normalizeUrl(p.url)} target="_blank" rel="noopener noreferrer">{p.label}</a>
              ))}
            </div>
          </article>
        </section>

        {/* 2. Application — the application-specific data. */}
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">This submission</p>
              <h2>Application</h2>
            </div>
          </div>
          <article className="dashboard-panel">
            <dl className="profile-facts">
              <div><dt>Applied job</dt><dd>{job.title || '—'}</dd></div>
              <div><dt>Application date</dt><dd>{application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : '—'}</dd></div>
              <div><dt>Status</dt><dd>{statusBadge}</dd></div>
            </dl>
            <p className="eyebrow" style={{ marginTop: '18px' }}>Cover letter</p>
            {application.coverLetter
              ? <p className="cover-letter">{application.coverLetter}</p>
              : <p className="empty-state">No cover letter was submitted.</p>}
          </article>
        </section>

        {/* 3. Match to This Job — unchanged scoring + breakdown. */}
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Why this score</p>
              <h2>Match to This Job</h2>
            </div>
            <span className={`match-badge inline ${scoreClass(application.matchScore || 0)}`}>
              <strong>{application.matchScore ?? 0}%</strong>
            </span>
          </div>
          <article className="dashboard-panel">
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
        </section>

        {/* 4. Application Actions — the current decision is reflected in the
            status; only the remaining decisions are offered, so a status can
            never be contradictory (it is a single value). */}
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Decision</p>
              <h2>Application Actions</h2>
            </div>
          </div>
          <article className="dashboard-panel">
            <label className="reason-field">
              Reason / Message to Applicant
              <textarea
                value={reason}
                onChange={(event) => setReason(capitalizeFirst(event.target.value.slice(0, MAX_REASON)))}
                maxLength={MAX_REASON}
                rows={4}
                placeholder="Share a short, professional message the applicant will see with this decision (e.g. why they were shortlisted, next steps, or feedback)."
              />
              <small>{reason.length}/{MAX_REASON} · Sent to the applicant with the status update.</small>
            </label>
            <div className="decision-bar">
              {ACTIONS.filter((action) => action.status !== application.status).map((action) => (
                <button
                  key={action.status}
                  type="button"
                  className={`decision-btn decision-${action.status.toLowerCase()}`}
                  disabled={saving}
                  onClick={() => updateStatus(action.status)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

export default ApplicationDetails;
