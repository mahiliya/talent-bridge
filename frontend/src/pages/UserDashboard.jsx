import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const API_URL = 'http://localhost:3000/api';
const PROFILE_FIELDS = [
  'fullName',
  'university',
  'fieldOfStudy',
  'skills',
  'preferredJobTypes',
  'preferredLocations',
  'remotePreference',
  'resume',
  'portfolioWebsite',
];

function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!token) {
      navigate('/');
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
        if (!meData.user) {
          throw new Error('This dashboard is available to User accounts only. Please log in as a User.');
        }

        setUser(meData.user);

        const [recommendationResponse, applicationResponse] = await Promise.all([
          fetch(`${API_URL}/matches/recommendations/jobs/${meData.user.id}`, { headers }),
          fetch(`${API_URL}/applications/user/${meData.user.id}`, { headers }),
        ]);

        if (recommendationResponse.ok) {
          setRecommendations(await recommendationResponse.json());
        }
        if (applicationResponse.ok) {
          setApplications(await applicationResponse.json());
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
    profile.remotePreference = profile.remotePreference || undefined;
    delete profile.resumeFile;

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

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">Talent Bridge</Link>
        <p className="sidebar-label">Workspace</p>
        <nav>
          <a href="#overview" className="active">Dashboard</a>
          <Link to="/internships">Browse Opportunities</Link>
          <a href="#applications">My Applications</a>
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

        <section className="dashboard-section" id="applications">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your activity</p>
              <h2>Recent applications</h2>
            </div>
          </div>
          <div className="opportunity-list">
            {applications.length ? (
              applications.slice(0, 4).map((application) => (
                <article className="opportunity" key={application.id}>
                  <div>
                    <h3>{application.job?.title || 'Application'}</h3>
                    <p>
                      {application.job?.company?.name || 'Company'} · {application.job?.jobType === 'INTERNSHIP' ? 'Internship' : 'Job'} · Applied {new Date(application.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`status status-${String(application.status || 'PENDING').toLowerCase()}`}>
                    {application.status === 'PENDING'
                      ? 'Pending'
                      : application.status === 'ACCEPTED'
                        ? 'Accepted'
                        : application.status === 'REJECTED'
                          ? 'Rejected'
                          : application.status}
                  </span>
                  <button type="button" className="text-link" onClick={() => withdrawApplication(application.id)}>Withdraw</button>
                </article>
              ))
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
                <input name="fullName" defaultValue={user.fullName || ''} required />
              </label>
              <label>
                University
                <input name="university" defaultValue={user.university || ''} />
              </label>
              <label>
                Field of study
                <input name="fieldOfStudy" defaultValue={user.fieldOfStudy || ''} />
              </label>
              <label>
                Skills
                <small>Separate with commas</small>
                <input name="skills" defaultValue={user.skills?.join(', ') || ''} />
              </label>
              <fieldset>
                <legend>Job types</legend>
                {['INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE'].map((type) => (
                  <label key={type} className="checkbox-option">
                    <input name="preferredJobType" type="checkbox" value={type} defaultChecked={user.preferredJobTypes?.includes(type)} />
                    {type.replace('_', ' ')}
                  </label>
                ))}
              </fieldset>
              <label>
                Remote preference
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
                <input name="preferredLocations" defaultValue={user.preferredLocations?.join(', ') || ''} />
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
