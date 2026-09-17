import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { capitalizeUncontrolled } from '../utils/capitalize';
import './UserDashboard.css';

const API_URL = 'http://localhost:3000/api';

// Turn an ApplicationStatus enum value (e.g. "SHORTLISTED") into a readable
// label (e.g. "Shortlisted") so company-set statuses show cleanly here.
const humanizeStatus = (value) =>
  String(value || 'PENDING')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// Candidate-facing explanation for an application status. Mirrors the wording of
// the server-generated notifications so the applications area and the
// notification feed stay consistent.
const statusMessage = (status, companyName, jobTitle) => {
  const company = companyName || 'the company';
  const role = jobTitle || 'this role';
  switch (String(status || '').toUpperCase()) {
    case 'ACCEPTED':
      return `Congratulations! You've been accepted for ${role} at ${company}. The team will contact you via email. Thank you for applying.`;
    case 'REJECTED':
      return `Thank you for applying for ${role} at ${company}. Your application was not selected this time — we encourage you to explore and apply for other opportunities on Talent Bridge.`;
    case 'SHORTLISTED':
      return `You've been shortlisted for ${role} at ${company}. Your application is progressing to the next stage.`;
    case 'INTERVIEW':
      return `You've been invited to interview for ${role} at ${company}. The team will be in touch with the details.`;
    case 'REVIEWED':
      return `Your application for ${role} at ${company} is being reviewed.`;
    default:
      return `Your application for ${role} at ${company} has been received and is pending review.`;
  }
};

// Statuses that still make sense to withdraw from (a decision hasn't closed the
// application out).
const WITHDRAWABLE_STATUSES = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW'];

const PROFILE_FIELDS = [
  'fullName',
  'phoneNumber',
  'university',
  'fieldOfStudy',
  'skills',
  'preferredJobTypes',
  'preferredLocations',
  'remotePreference',
  'resume',
  'portfolioWebsite',
];

// Basic phone validation: at least 7 digits, optional leading + and common
// separators. Deliberately permissive to accept international formats.
const isValidPhone = (value) => /^\+?[0-9][0-9\s\-()]{6,}$/.test(String(value || '').trim());

function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const loadDashboard = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const meResponse = await fetch(`${API_URL}/auth/me`, { headers });
        if (!meResponse.ok) {
          throw new Error('Your session has expired. Please log in again.');
        }

        const meData = await meResponse.json();
        // Role enforcement: a signed-in company account belongs on the company
        // dashboard, not here. Redirect rather than log them out (mirrors the
        // company dashboard's handling of user accounts).
        if (meData.company && !meData.user) {
          navigate('/company/dashboard');
          return;
        }
        if (!meData.user) {
          throw new Error('This dashboard is available to User accounts only. Please log in as a User.');
        }

        setUser(meData.user);

        const [recommendationResponse, applicationResponse, notificationResponse] = await Promise.all([
          fetch(`${API_URL}/matches/recommendations/jobs/${meData.user.id}`, { headers }),
          fetch(`${API_URL}/applications/user/${meData.user.id}`, { headers }),
          fetch(`${API_URL}/notifications/user/${meData.user.id}`, { headers }),
        ]);

        if (recommendationResponse.ok) {
          setRecommendations(await recommendationResponse.json());
        }
        if (applicationResponse.ok) {
          setApplications(await applicationResponse.json());
        }
        if (notificationResponse.ok) {
          setNotifications(await notificationResponse.json());
        }
      } catch (loadError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setError(loadError.message);
      }
    };

    loadDashboard();
  }, [navigate, token]);

  useEffect(() => {
    if (user && !showProfileForm) {
      setShowProfileForm(!isProfileComplete(user));
    }
  }, [user]);

  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    const filledFields = PROFILE_FIELDS.filter((field) => {
      const value = user[field];
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    }).length;

    return Math.round((filledFields / PROFILE_FIELDS.length) * 100);
  }, [user]);

  const isProfileComplete = (currentUser) => {
    const filledFields = PROFILE_FIELDS.filter((field) => {
      const value = currentUser[field];
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    }).length;

    return (filledFields / PROFILE_FIELDS.length) * 100 >= 80;
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setProfileSaved(false);

    const formData = new FormData(event.currentTarget);
    const profile = Object.fromEntries(formData.entries());
    profile.skills = String(profile.skills || '')
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
    profile.preferredJobTypes = formData.getAll('preferredJobType');
    delete profile.preferredJobType;
    profile.preferredLocations = String(profile.preferredLocations || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    profile.preferredIndustries = String(profile.preferredIndustries || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    profile.remotePreference = profile.remotePreference || undefined;
    // experienceLevel and minSalary are sent as-is; the backend validates the
    // level against the ExperienceLevel enum and coerces the (numeric) salary.
    profile.experienceLevel = profile.experienceLevel || '';
    profile.minSalary = String(profile.minSalary ?? '').trim();
    delete profile.resumeFile;

    // Phone number is required so companies can contact accepted applicants.
    profile.phoneNumber = String(profile.phoneNumber || '').trim();
    if (!isValidPhone(profile.phoneNumber)) {
      setError('Please enter a valid phone number so companies can contact you.');
      setSaving(false);
      return;
    }

    if (resumeFile) {
      if (resumeFile.type !== 'application/pdf') {
        setError('Resume must be a PDF file.');
        setSaving(false);
        return;
      }

      profile.resume = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(resumeFile);
      });
    }

    try {
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to update your profile.');
      }

      setUser(data.data.user);
      setResumeFile(null);
      setProfileSaved(true);
      setShowProfileForm(false);

      const recommendationResponse = await fetch(`${API_URL}/matches/recommendations/jobs/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (recommendationResponse.ok) {
        setRecommendations(await recommendationResponse.json());
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const refreshApplications = async () => {
    if (!user) return;
    const headers = { Authorization: `Bearer ${token}` };

    const [applicationsResponse, recommendationsResponse] = await Promise.all([
      fetch(`${API_URL}/applications/user/${user.id}`, { headers }),
      fetch(`${API_URL}/matches/recommendations/jobs/${user.id}`, { headers }),
    ]);

    if (applicationsResponse.ok) {
      setApplications(await applicationsResponse.json());
    }
    if (recommendationsResponse.ok) {
      setRecommendations(await recommendationsResponse.json());
    }
  };

  const withdrawApplication = async (applicationId) => {
    const response = await fetch(`${API_URL}/applications/${applicationId}/withdraw`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      await refreshApplications();
    } else {
      setError('We could not withdraw this application. Please try again.');
    }
  };

  const markNotificationRead = async (id) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.isRead) return;
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    const response = await fetch(`${API_URL}/notifications/user/${user.id}/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return <main className="dashboard-page"><p className="dashboard-state">{error || 'Loading your dashboard...'}</p></main>;
  }

  const profileIsComplete = isProfileComplete(user);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">Talent Bridge</Link>
        <p className="sidebar-label">Workspace</p>
        <nav>
          <a href="#overview" className="active">Dashboard</a>
          <Link to="/internships">Browse Opportunities</Link>
          <a href="#applications">My Applications</a>
          <a href="#notifications">Notifications{unreadCount ? ` (${unreadCount})` : ''}</a>
          <a href="#profile">Profile</a>
          <a href="#recommendations">Recommendations</a>
        </nav>
        <button className="logout-button" onClick={logout}>Log out</button>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header" id="overview">
          <div>
            <p className="eyebrow">User workspace</p>
            <h1>Welcome back, {user.fullName.split(' ')[0]}</h1>
            <p>
              {profileIsComplete
                ? 'Your profile is complete and recommendations are active.'
                : 'Build your profile and discover work that fits your direction.'}
            </p>
          </div>
          <div className="completion-ring"><strong>{profileCompletion}%</strong><span>profile</span></div>
        </header>

        {error && <p className="dashboard-error">{error}</p>}

        <section className="dashboard-grid">
          <article className="dashboard-panel profile-progress">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Your profile</p>
                <h2>{profileIsComplete ? 'Profile completed' : 'Make your next match stronger'}</h2>
              </div>
              <span>{profileCompletion}%</span>
            </div>
            <div className="progress-track"><div style={{ width: `${profileCompletion}%` }} /></div>
            <p>
              {profileIsComplete
                ? 'Your profile is up to date. You can update it any time and recommendations will refresh automatically.'
                : 'Add education, skills, preferences, resume, and portfolio details so recommendations can reflect your goals.'}
            </p>
            <button type="button" className="primary-action" onClick={() => setShowProfileForm((open) => !open)}>
              {profileIsComplete ? 'Update Profile' : 'Complete profile'}
            </button>
          </article>

          <article className="dashboard-panel quick-action">
            <p className="eyebrow">Next step</p>
            <h2>Find your internship</h2>
            <p>Explore open opportunities selected around your profile.</p>
            <Link to="/internships" className="primary-action">Browse Opportunities</Link>
          </article>
        </section>

        <section className="dashboard-section" id="recommendations">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Based on your profile</p>
              <h2>Recommended opportunities</h2>
            </div>
            <Link to="/internships">View all →</Link>
          </div>
          <div className="opportunity-list">
            {recommendations.length ? (
              recommendations.slice(0, 4).map((job) => (
                <article
                  className="opportunity"
                  key={job.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/internships/${job.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/internships/${job.id}`);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <p className="eyebrow">Recommended match</p>
                    <h3>{job.title}</h3>
                    <p>{job.company?.name || 'Talent Bridge company'} · {job.location}{job.jobType ? ` · ${job.jobType.replace('_', ' ')}` : ''}</p>
                  </div>
                  <span>{job.matchScore || 0}% match</span>
                  <button
                    type="button"
                    className="primary-action"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/internships/${job.id}`);
                    }}
                  >
                    Apply for this job
                  </button>
                </article>
              ))
            ) : (
              <p className="empty-state">
                {profileIsComplete ? 'No matching opportunities are available right now.' : 'Complete your skills and preferences to unlock recommendations.'}
              </p>
            )}
          </div>
        </section>

        <section className="dashboard-section" id="notifications">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Updates</p>
              <h2>Notifications{unreadCount ? ` · ${unreadCount} new` : ''}</h2>
            </div>
            {unreadCount > 0 && (
              <button type="button" className="text-link" onClick={markAllNotificationsRead}>
                Mark all as read
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length ? (
              notifications.map((notification) => (
                <article
                  className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => markNotificationRead(notification.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      markNotificationRead(notification.id);
                    }
                  }}
                >
                  <div className="notification-body">
                    <div className="notification-top">
                      <h4>{notification.title}</h4>
                      <span className="notification-date">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                  </div>
                  {!notification.isRead && <span className="notification-dot" aria-label="Unread" />}
                </article>
              ))
            ) : (
              <p className="empty-state">
                You have no notifications yet. Updates about your applications will appear here.
              </p>
            )}
          </div>
        </section>

        <section className="dashboard-section" id="applications">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your activity</p>
              <h2>My applications</h2>
            </div>
          </div>
          <div className="application-list">
            {applications.length ? (
              applications.map((application) => {
                const status = String(application.status || 'PENDING').toUpperCase();
                const job = application.job || {};
                const companyName = job.company?.name || 'Company';
                const jobTitle = job.title || 'Application';
                const jobMeta = [
                  job.isInternship ? 'Internship' : job.jobType ? humanizeStatus(job.jobType) : null,
                  job.location,
                  job.workMode ? humanizeStatus(job.workMode) : null,
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <article className="application-card" key={application.id}>
                    <div className="application-head">
                      <div>
                        <h3>{jobTitle}</h3>
                        <p>
                          {companyName}
                          {jobMeta ? ` · ${jobMeta}` : ''} · Applied{' '}
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`status status-${status.toLowerCase()}`}>
                        {humanizeStatus(status)}
                      </span>
                    </div>
                    <p className={`application-message application-message-${status.toLowerCase()}`}>
                      {statusMessage(status, companyName, jobTitle)}
                    </p>
                    {application.notes && (
                      <p className="application-note">
                        <strong>Message from {companyName}:</strong> {application.notes}
                      </p>
                    )}
                    <div className="application-actions">
                      {job.id && (
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => navigate(`/internships/${job.id}`)}
                        >
                          View job details
                        </button>
                      )}
                      {WITHDRAWABLE_STATUSES.includes(status) && (
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => withdrawApplication(application.id)}
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="empty-state">Your applications will appear here after you apply.</p>
            )}
          </div>
        </section>

        <section className="dashboard-section" id="profile">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Keep it current</p>
              <h2>{profileIsComplete ? 'Profile completed' : 'Profile details'}</h2>
            </div>
            {profileIsComplete && (
              <button type="button" className="text-link" onClick={() => setShowProfileForm((open) => !open)}>
                {showProfileForm ? 'Hide form' : 'Update Profile'}
              </button>
            )}
          </div>

          {profileSaved && <p className="profile-saved">Profile saved. Recommendations have been refreshed using your latest details.</p>}

          {(!profileIsComplete || showProfileForm) && (
            <form className="profile-form" onSubmit={updateProfile}>
              <label>
                Full name
                <input name="fullName" defaultValue={user.fullName || ''} onChange={capitalizeUncontrolled} required />
              </label>
              <label>
                Email
                <input type="email" value={user.email || ''} readOnly disabled />
                <small>Your account email — used to contact you. Not editable here.</small>
              </label>
              <label>
                Phone number
                <input
                  name="phoneNumber"
                  type="tel"
                  defaultValue={user.phoneNumber || ''}
                  placeholder="e.g. +251 91 234 5678"
                  pattern="\+?[0-9][0-9\s\-()]{6,}"
                  title="Enter a valid phone number (at least 7 digits; may start with +)"
                  required
                />
                <small>Companies use this to contact you after you're accepted.</small>
              </label>
              <label>
                University
                <input name="university" defaultValue={user.university || ''} onChange={capitalizeUncontrolled} />
              </label>
              <label>
                Field of study
                <input name="fieldOfStudy" defaultValue={user.fieldOfStudy || ''} onChange={capitalizeUncontrolled} />
              </label>
              <label>
                Skills
                <small>Separate with commas</small>
                <input name="skills" defaultValue={user.skills?.join(', ') || ''} onChange={capitalizeUncontrolled} />
              </label>
              <h3 className="form-section-title">Job Preferences</h3>
              <p className="form-section-note">
                These guide the opportunities we recommend to you.
              </p>
              <label>
                Experience / job level
                <select name="experienceLevel" defaultValue={user.experienceLevel || ''}>
                  <option value="">Choose one</option>
                  <option value="ENTRY">Entry</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="MID">Mid</option>
                  <option value="SENIOR">Senior</option>
                  <option value="LEAD">Lead</option>
                </select>
              </label>
              <fieldset>
                <legend>Preferred job types</legend>
                {['INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE'].map((type) => (
                  <label key={type} className="checkbox-option">
                    <input name="preferredJobType" type="checkbox" value={type} defaultChecked={user.preferredJobTypes?.includes(type)} />
                    {type.replace('_', ' ')}
                  </label>
                ))}
              </fieldset>
              <label>
                Work mode preference
                <select name="remotePreference" defaultValue={user.remotePreference || ''}>
                  <option value="">Choose one</option>
                  <option value="ON_SITE">On site</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="FLEXIBLE">Flexible</option>
                </select>
              </label>
              <label>
                Preferred locations
                <small>Comma-separated</small>
                <input name="preferredLocations" defaultValue={user.preferredLocations?.join(', ') || ''} onChange={capitalizeUncontrolled} />
              </label>
              <label>
                Preferred industries / field
                <small>Comma-separated</small>
                <input name="preferredIndustries" defaultValue={user.preferredIndustries?.join(', ') || ''} onChange={capitalizeUncontrolled} />
              </label>
              <label>
                Minimum salary
                <small>Optional — numbers only</small>
                <input
                  name="minSalary"
                  type="number"
                  min="0"
                  step="1000"
                  defaultValue={user.minSalary ?? ''}
                  placeholder="e.g. 50000"
                />
              </label>
              <label>
                Resume (PDF)
                <input name="resumeFile" type="file" accept="application/pdf,.pdf" onChange={(event) => setResumeFile(event.target.files?.[0] || null)} />
              </label>
              <label>
                Portfolio website
                <input name="portfolioWebsite" defaultValue={user.portfolioWebsite || ''} />
              </label>
              <button type="submit" className="primary-action" disabled={saving}>
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}

export default UserDashboard;
