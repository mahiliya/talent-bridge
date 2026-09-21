import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
// Vite resolves this to a bundled URL for the PDF.js web worker. Rendering the
// PDF ourselves (to <canvas>) means the preview no longer depends on the
// browser's built-in PDF plugin being enabled — which is why the <object>/<iframe>
// embed showed up blank for some browsers even though the download worked.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import CompanySidebar from '../components/CompanySidebar';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
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

// Turn a stored link into a SAFE, absolute, external URL. Users often store a
// bare domain ("example.com") or even a leading-slash value ("/example.com").
// We prepend https:// when no scheme is present and validate the result so we
// never navigate to a broken/internal page (that was the cause of the portfolio
// 404 — a scheme-less value was treated as a React-Router path). Returns '' when
// the value cannot be a real external site so the caller can show a message
// instead of linking to a dead URL. Only http(s) is allowed (no open redirect,
// no javascript:/data: schemes).
const toExternalUrl = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, '')}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    // A real external host must contain a dot (rejects "/portfolio", "localhost", etc.).
    if (!u.hostname || !u.hostname.includes('.')) return '';
    return u.href;
  } catch {
    return '';
  }
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
  // Object URL for the fetched resume PDF, shown in an in-app viewer. Empty when
  // the viewer is closed. Used both as the PDF.js source and the Download link.
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);
  // Error surfaced inside the viewer if the PDF cannot be rendered.
  const [resumeError, setResumeError] = useState('');
  // Container the PDF.js canvases are appended into (one <canvas> per page).
  const viewerRef = useRef(null);

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

  // Open the applicant's resume through the authorized backend endpoint.
  //
  // We fetch the PDF with the auth token (so it stays private), keep a blob:
  // object URL for the Download link, and render the pages ourselves with
  // PDF.js (see the effect below). Rendering to <canvas> means the preview does
  // NOT rely on the browser's built-in PDF plugin — earlier the <object>/<iframe>
  // embed came up blank on browsers where inline PDF viewing is disabled, even
  // though the same blob downloaded fine. It also avoids the older "blob: URL
  // becomes a Google search" bug, since the blob is never a top-level navigation.
  const viewResume = async () => {
    setError('');
    setResumeError('');
    setResumeLoading(true);
    try {
      const res = await fetch(`${API_URL}/applications/${applicationId}/resume`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to open the resume.');
      }
      const blob = await res.blob();
      // Ensure the object URL is typed as a PDF so the Download saves it correctly.
      const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      // Replace any previous viewer URL, revoking it so we don't leak object URLs.
      setResumeUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      setError(err.message || 'Unable to open the resume.');
    } finally {
      setResumeLoading(false);
    }
  };

  // Render the fetched PDF into the viewer, one <canvas> per page, whenever the
  // viewer opens (resumeUrl set). PDF.js draws the pages, so no browser PDF
  // plugin is needed. Cancels cleanly if the modal is closed mid-render.
  useEffect(() => {
    const container = viewerRef.current;
    if (!resumeUrl || !container) return;

    let cancelled = false;
    let pdf;
    setResumeError('');
    container.replaceChildren();

    const render = async () => {
      try {
        pdf = await pdfjsLib.getDocument(resumeUrl).promise;
        if (cancelled) return;
        // Fit each page to the container width, sharpened for high-DPI screens.
        const dpr = window.devicePixelRatio || 1;
        const targetWidth = container.clientWidth || 900;
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
          const page = await pdf.getPage(pageNum);
          if (cancelled) return;
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = targetWidth / baseViewport.width;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 12px';
          canvas.style.boxShadow = '0 1px 6px rgba(0,0,0,0.35)';
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
        }
      } catch (err) {
        if (!cancelled) setResumeError('The resume could not be displayed. You can still download it.');
      }
    };

    render();

    return () => {
      cancelled = true;
      if (pdf) pdf.destroy();
    };
  }, [resumeUrl]);

  // Close the in-app resume viewer and release its object URL.
  const closeResume = () => {
    setResumeError('');
    setResumeUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
  };

  // Safety net: release the current object URL if the page unmounts while the
  // viewer is open (double-revoke of an already-released URL is a harmless no-op).
  useEffect(() => () => {
    if (resumeUrl) URL.revokeObjectURL(resumeUrl);
  }, [resumeUrl]);

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
  ]
    .map((p) => ({ label: p.label, href: toExternalUrl(p.url) }))
    .filter((p) => p.href);
  // Raw stored value + the safe external URL derived from it (empty if invalid).
  const portfolioRaw = a.portfolioWebsite;
  const portfolioHref = toExternalUrl(portfolioRaw);
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
                ? <button type="button" className="doc-link" onClick={viewResume} disabled={resumeLoading}>{resumeLoading ? 'Loading…' : 'View Resume'}</button>
                : <span className="empty-state">No resume uploaded.</span>}
            </div>

            <p className="eyebrow" style={{ marginTop: '18px' }}>Portfolio</p>
            <div className="doc-links">
              {portfolioHref
                ? <a className="doc-link" href={portfolioHref} target="_blank" rel="noopener noreferrer">View Portfolio</a>
                : <span className="empty-state">{portfolioRaw ? 'Portfolio link is not a valid URL.' : 'No portfolio provided'}</span>}
              {extraLinks.map((p) => (
                <a className="doc-link" key={p.label} href={p.href} target="_blank" rel="noopener noreferrer">{p.label}</a>
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

      {/* In-app resume viewer. Pages are drawn by PDF.js into <canvas> elements
          inside `viewerRef`, so the preview does not depend on the browser's
          built-in PDF plugin. A Download link is offered as a fallback. */}
      {resumeUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Resume"
          onClick={closeResume}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '10px', width: 'min(960px, 100%)',
              height: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 14px', borderBottom: '1px solid #e5e7eb' }}>
              <strong style={{ marginRight: 'auto' }}>Resume — {a.fullName || 'Applicant'}</strong>
              <a className="text-link" href={resumeUrl} download="resume.pdf">Download</a>
              <button type="button" className="text-link" onClick={closeResume} aria-label="Close resume viewer">Close ✕</button>
            </div>
            <div
              ref={viewerRef}
              style={{ flex: 1, width: '100%', overflow: 'auto', background: '#525659', padding: '16px' }}
            />
            {resumeError && (
              <p style={{ margin: 0, padding: '10px 14px', color: '#b91c1c', background: '#fef2f2', borderTop: '1px solid #e5e7eb' }}>
                {resumeError}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default ApplicationDetails;
