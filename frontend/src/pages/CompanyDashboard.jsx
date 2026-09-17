import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CompanySidebar from '../components/CompanySidebar';
import { COMPANY_NAV_ITEMS } from '../components/companyNav';
// Reuse the existing dashboard design system, then layer company-only extras.
import './UserDashboard.css';
import './CompanyDashboard.css';

const API_URL = 'http://localhost:3000/api';

// Candidates that have progressed past initial review (real statuses).
const SHORTLISTED_STATUSES = ['SHORTLISTED', 'INTERVIEW', 'ACCEPTED'];

const humanize = (value) =>
  String(value || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

function CompanyDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  // The sidebar can request a placeholder section via navigation state.
  const [activeSection, setActiveSection] = useState(location.state?.section || 'dashboard');

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    setActiveSection(location.state?.section || 'dashboard');
  }, [location.state]);

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

        // A USER account must never see the company dashboard — send them to
        // the existing user dashboard instead.
        if (meData.user && !meData.company) {
          navigate('/dashboard');
          return;
        }
        if (!meData.company) {
          throw new Error('This dashboard is available to Company accounts only.');
        }

        setCompany(meData.company);

        // All three endpoints are company-authenticated and scoped to the
        // logged-in company, so the data returned belongs only to this company.
        const [jobsResponse, applicationsResponse, notificationsResponse] = await Promise.all([
          fetch(`${API_URL}/jobs/mine`, { headers }),
          fetch(`${API_URL}/applications/company/${meData.company.id}`, { headers }),
          fetch(`${API_URL}/notifications/company/${meData.company.id}`, { headers }),
        ]);

        if (jobsResponse.ok) {
          setJobs(await jobsResponse.json());
        }
        if (applicationsResponse.ok) {
          setApplications(await applicationsResponse.json());
        }
        if (notificationsResponse.ok) {
          setNotifications(await notificationsResponse.json());
        }
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadDashboard();
  }, [navigate, token]);

  const stats = useMemo(() => {
    const activeOpportunities = jobs.filter((job) => job.isActive && !job.isDraft).length;
    const totalApplications = applications.length;
    const shortlistedCandidates = applications.filter((application) =>
      SHORTLISTED_STATUSES.includes(application.status)
    ).length;

    return { activeOpportunities, totalApplications, shortlistedCandidates };
  }, [jobs, applications]);

  const recentApplications = applications.slice(0, 5);
  // Currently live opportunities (published + active), most recent first.
  const activeJobs = jobs.filter((job) => job.isActive && !job.isDraft);
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

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
    if (!company) return;
    const response = await fetch(`${API_URL}/notifications/company/${company.id}/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  if (!company) {
    return (
      <main className="dashboard-page">
        <p className="dashboard-state">{error || 'Loading your dashboard...'}</p>
      </main>
    );
  }

  const renderDashboard = () => (
    <>
      <header className="dashboard-header" id="overview">
        <div>
          <p className="eyebrow">Company workspace</p>
          <h1>Welcome, {company.name}</h1>
          <p>
            {company.industry ? `${company.industry} · ` : ''}
            {company.location || 'Manage your opportunities and applicants in one place.'}
          </p>
        </div>
        <button type="button" className="primary-action" onClick={() => navigate('/company/post-opportunity')}>
          Post Opportunity
        </button>
      </header>

      {error && <p className="dashboard-error">{error}</p>}

      <section className="company-stat-cards">
        <article className="company-stat-card">
          <p className="eyebrow">Active</p>
          <strong>{stats.activeOpportunities}</strong>
          <span>Active Opportunities</span>
        </article>
        <article className="company-stat-card">
          <p className="eyebrow">Total</p>
          <strong>{stats.totalApplications}</strong>
          <span>Total Applications</span>
        </article>
        <article className="company-stat-card">
          <p className="eyebrow">Pipeline</p>
          <strong>{stats.shortlistedCandidates}</strong>
          <span>Shortlisted Candidates</span>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel quick-action">
          <p className="eyebrow">Quick action</p>
          <h2>Post a new opportunity</h2>
          <p>Publish an internship or job so it appears on the public opportunities page and in candidate recommendations.</p>
          <button type="button" className="primary-action" onClick={() => setActiveSection('post')}>
            Post Opportunity
          </button>
        </article>

        <article className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Your postings</p>
              <h2>Opportunities</h2>
            </div>
            <span>{jobs.length}</span>
          </div>
          <p>
            {stats.activeOpportunities} active
            {jobs.some((job) => job.isDraft) ? ` · ${jobs.filter((job) => job.isDraft).length} draft` : ''}
          </p>
        </article>
      </section>

      <section className="dashboard-section" id="recent-applications">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Latest activity</p>
            <h2>Recent applications</h2>
          </div>
        </div>
        <div className="opportunity-list">
          {recentApplications.length ? (
            recentApplications.map((application) => (
              <article className="opportunity" key={application.id}>
                <div>
                  <h3>{application.applicant?.fullName || 'Candidate'}</h3>
                  <p>
                    {application.job?.title || 'Opportunity'}
                    {application.appliedAt ? ` · Applied ${new Date(application.appliedAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <span className={`status status-${String(application.status || 'PENDING').toLowerCase()}`}>
                  {humanize(application.status || 'PENDING')}
                </span>
              </article>
            ))
          ) : (
            <p className="empty-state">Applications to your opportunities will appear here.</p>
          )}
        </div>
      </section>

      <section className="dashboard-section" id="notifications">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Updates</p>
            <h2>Notifications{unreadNotifications ? ` · ${unreadNotifications} new` : ''}</h2>
          </div>
          {unreadNotifications > 0 && (
            <button type="button" className="text-link" onClick={markAllNotificationsRead}>
              Mark all as read
            </button>
          )}
        </div>
        <div className="notification-list">
          {notifications.length ? (
            notifications.slice(0, 5).map((notification) => (
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
              When a candidate applies to one of your opportunities, you'll be notified here.
            </p>
          )}
        </div>
      </section>

      <section className="dashboard-section" id="active-opportunities">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Currently live</p>
            <h2>Active opportunities</h2>
          </div>
          <span className="section-count">{activeJobs.length}</span>
        </div>
        <div className="opportunity-list">
          {activeJobs.length ? (
            activeJobs.map((job) => {
              const type = job.isInternship ? 'Internship' : humanize(job.jobType) || 'Job';
              const place = [job.location, job.workMode ? humanize(job.workMode) : '']
                .filter(Boolean)
                .join(' · ');
              const count = job.applicationCount ?? 0;
              return (
                <article
                  className="opportunity"
                  key={job.id}
                  role="link"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/company/jobs/${job.id}/applicants`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/company/jobs/${job.id}/applicants`);
                    }
                  }}
                >
                  <div>
                    <h3>{job.title}</h3>
                    <p>
                      {type}
                      {place ? ` · ${place}` : ''}
                      {job.deadline ? ` · Closes ${new Date(job.deadline).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <span>{count} application{count === 1 ? '' : 's'} →</span>
                </article>
              );
            })
          ) : (
            <p className="empty-state">
              You have no active opportunities yet. Use “Post Opportunity” to publish one.
            </p>
          )}
        </div>
      </section>
    </>
  );

  const renderNotificationItems = () => (
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
          No notifications yet. When a candidate applies to one of your opportunities, it will appear here.
        </p>
      )}
    </div>
  );

  const renderNotifications = () => (
    <>
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Company workspace</p>
          <h1>Notifications{unreadNotifications ? ` · ${unreadNotifications} new` : ''}</h1>
          <p>New applications to your opportunities show up here.</p>
        </div>
        {unreadNotifications > 0 && (
          <button type="button" className="primary-action" onClick={markAllNotificationsRead}>
            Mark all as read
          </button>
        )}
      </header>
      {error && <p className="dashboard-error">{error}</p>}
      <section className="dashboard-section">{renderNotificationItems()}</section>
    </>
  );

  const renderPlaceholder = (title) => (
    <>
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Company workspace</p>
          <h1>{title}</h1>
          <p>This section is coming soon.</p>
        </div>
      </header>
      <section className="dashboard-section">
        <p className="empty-state">
          {title} is not available yet. Use the Dashboard to review your activity in the meantime.
        </p>
      </section>
    </>
  );

  const activeLabel = COMPANY_NAV_ITEMS.find((item) => item.key === activeSection)?.label || 'Dashboard';

  return (
    <main className="dashboard-page">
      <CompanySidebar active={activeSection} />

      <section className="dashboard-content">
        {activeSection === 'dashboard'
          ? renderDashboard()
          : activeSection === 'notifications'
            ? renderNotifications()
            : renderPlaceholder(activeLabel)}
      </section>
    </main>
  );
}

export default CompanyDashboard;
