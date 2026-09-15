import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CompanySidebar from '../components/CompanySidebar';
import './UserDashboard.css';
import './CompanyDashboard.css';
import './PostOpportunity.css';

const API_URL = 'http://localhost:3000/api';

// Backend-supported enum values (mapped from friendly UI labels).
const WORK_MODES = [
  { value: 'ON_SITE', label: 'On-site' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'REMOTE', label: 'Remote' },
];
const EXPERIENCE_LEVELS = [
  { value: 'ENTRY', label: 'Entry' },
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'LEAD', label: 'Lead' },
];
const TARGET_AUDIENCES = [
  { value: 'BOTH', label: 'Students & Graduates' },
  { value: 'STUDENTS', label: 'Students' },
  { value: 'GRADUATES', label: 'Graduates' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

function PostOpportunity() {
  const navigate = useNavigate();
  // When a :jobId is present in the route we are editing an existing
  // opportunity; otherwise we are creating a new one. The same form serves both.
  const { jobId } = useParams();
  const isEdit = Boolean(jobId);
  const [company, setCompany] = useState(null);
  const [authError, setAuthError] = useState('');
  const [jobLoaded, setJobLoaded] = useState(!isEdit);
  // Draft state of the opportunity being edited, so we can offer the right
  // save/publish actions.
  const [existingIsDraft, setExistingIsDraft] = useState(false);

  // Form state
  const [isInternship, setIsInternship] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [targetAudience, setTargetAudience] = useState('BOTH');
  const [positions, setPositions] = useState('1');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [internshipDuration, setInternshipDuration] = useState('');
  const [salary, setSalary] = useState('');
  const [deadline, setDeadline] = useState('');

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { isDraft, job }

  const token = localStorage.getItem('accessToken');

  // Company-only guard (backend also enforces this on every write).
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const verify = async () => {
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

        // In edit mode, load the existing opportunity and prefill the form.
        // The backend only returns drafts/inactive jobs to their owner, so a
        // 404 here also covers "not yours".
        if (isEdit) {
          const jobRes = await fetch(`${API_URL}/jobs/${jobId}`, { headers });
          if (!jobRes.ok) throw new Error('This opportunity could not be found, or it does not belong to your company.');
          const job = await jobRes.json();
          setIsInternship(Boolean(job.isInternship));
          setTitle(job.title || '');
          setCategory(job.category || '');
          setDescription(job.description || '');
          setRequiredSkills(Array.isArray(job.requirements) ? job.requirements.join(', ') : '');
          setExperienceLevel(job.experienceLevel || '');
          setTargetAudience(job.targetAudience?.[0] || 'BOTH');
          setPositions(job.positions != null ? String(job.positions) : '');
          setLocation(job.location || '');
          setWorkMode(job.workMode || '');
          setInternshipDuration(job.internshipDuration || '');
          setSalary(job.salary || '');
          setDeadline(job.deadline ? new Date(job.deadline).toISOString().slice(0, 10) : '');
          setExistingIsDraft(Boolean(job.isDraft));
          setJobLoaded(true);
        }
      } catch (err) {
        setAuthError(err.message);
      }
    };
    verify();
  }, [navigate, token, isEdit, jobId]);

  const skillsArray = requiredSkills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const validate = (isDraft) => {
    const e = {};

    // Always required (the backend requires these even for drafts).
    if (!title.trim()) e.title = 'Title is required.';
    if (!description.trim()) e.description = 'Description is required.';
    if (!deadline) {
      e.deadline = 'Application deadline is required.';
    } else if (deadline < todayStr()) {
      e.deadline = 'Deadline cannot be in the past.';
    }
    if (positions) {
      const n = Number(positions);
      if (!Number.isInteger(n) || n < 1) e.positions = 'Enter a positive whole number.';
    }

    if (!isDraft) {
      // Stricter checks required to publish.
      if (!category.trim()) e.category = 'Category is required.';
      if (skillsArray.length === 0) e.requiredSkills = 'Add at least one required skill to publish.';
      if (!experienceLevel) e.experienceLevel = 'Select an experience level.';
      if (!positions) e.positions = 'Number of positions is required.';
      if (!location.trim()) e.location = 'Location is required.';
      if (!workMode) e.workMode = 'Select a work mode.';
      if (isInternship && !internshipDuration.trim()) e.internshipDuration = 'Internship duration is required.';
    }

    return e;
  };

  const buildPayload = (isDraft) => ({
    title: title.trim(),
    description: description.trim(),
    category: category.trim() || undefined,
    requiredSkills: skillsArray,
    experienceLevel: experienceLevel || undefined,
    targetAudience: targetAudience ? [targetAudience] : undefined,
    positions: positions ? Number(positions) : undefined,
    location: location.trim() || undefined,
    workMode: workMode || undefined,
    isInternship,
    internshipDuration: isInternship ? internshipDuration.trim() || undefined : undefined,
    salary: salary.trim() || undefined,
    // End of the chosen day, so "today" counts as a valid future deadline.
    deadline: new Date(`${deadline}T23:59:59`).toISOString(),
    isDraft,
  });

  const submit = async (isDraft) => {
    setServerError('');
    const validationErrors = validate(isDraft);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await fetch(isEdit ? `${API_URL}/jobs/${jobId}` : `${API_URL}/jobs`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildPayload(isDraft)),
      });
      const data = await response.json();
      if (!response.ok) {
        setServerError(data.error || data.message || 'We could not save this opportunity. Please try again.');
        return;
      }
      setResult({ isDraft, job: data, edited: isEdit });
    } catch (err) {
      setServerError(err.message || 'Unable to reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsInternship(true);
    setTitle('');
    setCategory('');
    setDescription('');
    setRequiredSkills('');
    setExperienceLevel('');
    setTargetAudience('BOTH');
    setPositions('1');
    setLocation('');
    setWorkMode('');
    setInternshipDuration('');
    setSalary('');
    setDeadline('');
    setErrors({});
    setServerError('');
    setResult(null);
  };

  if (authError) {
    return (
      <main className="dashboard-page">
        <p className="dashboard-state">{authError}</p>
      </main>
    );
  }
  if (!company || !jobLoaded) {
    return (
      <main className="dashboard-page">
        <p className="dashboard-state">Loading…</p>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <CompanySidebar active="post" />

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Company workspace</p>
            <h1>{isEdit ? 'Edit Opportunity' : 'Post Opportunity'}</h1>
            <p>
              {isEdit
                ? 'Update this opportunity. Your changes take effect immediately — no need to repost.'
                : 'Create an internship or job. Save it as a draft or publish it to the public opportunities page.'}
            </p>
          </div>
        </header>

        {result ? (
          <section className="post-success" role="status">
            <p className="eyebrow">{result.edited ? 'Changes saved' : result.isDraft ? 'Draft saved' : 'Published'}</p>
            <h2>
              {result.edited
                ? `“${result.job.title}” has been updated.`
                : result.isDraft
                  ? `“${result.job.title}” was saved as a draft.`
                  : `“${result.job.title}” is now live.`}
            </h2>
            <p>
              {result.isDraft
                ? 'Drafts are private — this opportunity will not appear on the public opportunities page or in recommendations until you publish it.'
                : 'This opportunity now appears on the public opportunities page and is eligible for candidate recommendations.'}
            </p>
            <div className="post-actions">
              {!result.isDraft && (
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => navigate(`/internships/${result.job.id}`)}
                >
                  View opportunity
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={() => navigate('/company/opportunities')}>
                My Opportunities
              </button>
              {!isEdit && (
                <button type="button" className="btn-ghost" onClick={resetForm}>
                  Post another
                </button>
              )}
            </div>
          </section>
        ) : (
          <form
            className="post-form"
            onSubmit={(event) => {
              event.preventDefault();
              submit(false);
            }}
            noValidate
          >
            {serverError && <p className="dashboard-error">{serverError}</p>}

            {/* Basic Information */}
            <fieldset className="post-section">
              <legend>Basic Information</legend>

              <div className="post-field">
                <span className="post-label">Opportunity Type <b className="req">*</b></span>
                <div className="account-type-selector" role="group" aria-label="Opportunity type">
                  <button type="button" className={isInternship ? 'selected' : ''} onClick={() => setIsInternship(true)}>
                    Internship
                  </button>
                  <button type="button" className={!isInternship ? 'selected' : ''} onClick={() => setIsInternship(false)}>
                    Job
                  </button>
                </div>
              </div>

              <div className="post-grid">
                <label className="post-field">
                  <span className="post-label">Title <b className="req">*</b></span>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frontend Developer Intern" />
                  {errors.title && <span className="post-error">{errors.title}</span>}
                </label>

                <label className="post-field">
                  <span className="post-label">Category <b className="req">*</b></span>
                  <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Software Engineering" />
                  {errors.category && <span className="post-error">{errors.category}</span>}
                </label>
              </div>

              <label className="post-field">
                <span className="post-label">Description <b className="req">*</b></span>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the role, responsibilities, and what a great candidate looks like."
                />
                {errors.description && <span className="post-error">{errors.description}</span>}
              </label>
            </fieldset>

            {/* Requirements */}
            <fieldset className="post-section">
              <legend>Requirements</legend>
              <label className="post-field">
                <span className="post-label">Required Skills <b className="req">*</b></span>
                <input
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="Comma-separated, e.g. React, JavaScript, CSS"
                />
                <small className="post-hint">Separate skills with commas. These power candidate matching.</small>
                {errors.requiredSkills && <span className="post-error">{errors.requiredSkills}</span>}
              </label>

              <div className="post-grid">
                <label className="post-field">
                  <span className="post-label">Experience Level <b className="req">*</b></span>
                  <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                    <option value="">Select level</option>
                    {EXPERIENCE_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                  {errors.experienceLevel && <span className="post-error">{errors.experienceLevel}</span>}
                </label>

                <label className="post-field">
                  <span className="post-label">Target Audience</span>
                  <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
                    {TARGET_AUDIENCES.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </label>

                <label className="post-field">
                  <span className="post-label">Number of Positions <b className="req">*</b></span>
                  <input type="number" min="1" value={positions} onChange={(e) => setPositions(e.target.value)} />
                  {errors.positions && <span className="post-error">{errors.positions}</span>}
                </label>
              </div>
            </fieldset>

            {/* Location & Work */}
            <fieldset className="post-section">
              <legend>Location &amp; Work</legend>
              <div className="post-grid">
                <label className="post-field">
                  <span className="post-label">Location <b className="req">*</b></span>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Addis Ababa" />
                  {errors.location && <span className="post-error">{errors.location}</span>}
                </label>

                <label className="post-field">
                  <span className="post-label">Work Mode <b className="req">*</b></span>
                  <select value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
                    <option value="">Select work mode</option>
                    {WORK_MODES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  {errors.workMode && <span className="post-error">{errors.workMode}</span>}
                </label>
              </div>
            </fieldset>

            {/* Internship-specific */}
            {isInternship && (
              <fieldset className="post-section">
                <legend>Internship Details</legend>
                <label className="post-field">
                  <span className="post-label">Internship Duration <b className="req">*</b></span>
                  <input
                    value={internshipDuration}
                    onChange={(e) => setInternshipDuration(e.target.value)}
                    placeholder="e.g. 3 months"
                  />
                  {errors.internshipDuration && <span className="post-error">{errors.internshipDuration}</span>}
                </label>
              </fieldset>
            )}

            {/* Compensation & Deadline */}
            <fieldset className="post-section">
              <legend>Compensation &amp; Deadline</legend>
              <div className="post-grid">
                <label className="post-field">
                  <span className="post-label">Salary / Compensation</span>
                  <input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. 15000 ETB / month" />
                </label>

                <label className="post-field">
                  <span className="post-label">Application Deadline <b className="req">*</b></span>
                  <input type="date" min={todayStr()} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                  {errors.deadline && <span className="post-error">{errors.deadline}</span>}
                </label>
              </div>
            </fieldset>

            <div className="post-actions">
              <button type="submit" className="primary-action" disabled={submitting}>
                {submitting
                  ? 'Working…'
                  : isEdit
                    ? existingIsDraft
                      ? 'Publish Opportunity'
                      : 'Save Changes'
                    : 'Publish Opportunity'}
              </button>
              {/* A draft (whether creating or editing) can still be saved as a
                  draft; a published opportunity stays published on save. */}
              {(!isEdit || existingIsDraft) && (
                <button type="button" className="btn-secondary" disabled={submitting} onClick={() => submit(true)}>
                  Save as Draft
                </button>
              )}
              <button
                type="button"
                className="btn-ghost"
                disabled={submitting}
                onClick={() => navigate(isEdit ? '/company/opportunities' : '/company/dashboard')}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

export default PostOpportunity;
