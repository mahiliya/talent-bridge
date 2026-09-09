import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:3000/api';

function JobExplorer({ user, applications, onApplicationsChange }) {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const loadJobs = async () => {
      const response = await fetch(`${API_URL}/jobs`);
      if (response.ok) {
        setJobs(await response.json());
      }
    };

    loadJobs().catch(() => {
      setMessage('Jobs are temporarily unavailable. Please try again.');
    });
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const text = `${job.title} ${job.description} ${job.company?.name || ''} ${job.requirements?.join(' ') || ''}`.toLowerCase();
      const matchesText = text.includes(search.toLowerCase());
      const matchesLocation = !location || job.location === location;
      const matchesType = !jobType || job.jobType === jobType;
      return matchesText && matchesLocation && matchesType;
    });
  }, [jobs, search, location, jobType]);

  const locations = [...new Set(jobs.map((job) => job.location).filter(Boolean))];
  const applicationsByJob = new Map(applications.map((application) => [application.jobId, application]));

  const openJob = async (job) => {
    setMessage('');
    const response = await fetch(`${API_URL}/jobs/${job.id}`);
    setSelectedJob(response.ok ? await response.json() : job);
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    if (!user) {
      setMessage('Please log in as a User before applying.');
      return;
    }
    if (!resumeFile && !user.resume) {
      setMessage('Please upload a PDF resume in your profile before applying.');
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      let resume = user.resume;
      if (resumeFile) {
        resume = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(resumeFile);
        });
      }

      const response = await fetch(`${API_URL}/applications/jobs/${selectedJob.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ coverLetter, resumeUrl: resume }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Unable to submit your application.');
      }

      setMessage('Application submitted successfully.');
      setSelectedJob(null);
      setCoverLetter('');
      setResumeFile(null);
      await onApplicationsChange();
    } catch (error) {
      setMessage(error.message || 'Unable to submit your application.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="dashboard-section job-explorer" id="find-internship">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Search and discover</p>
          <h2>Browse opportunities</h2>
        </div>
        <span>{filteredJobs.length} available</span>
      </div>

      {message && <p className="dashboard-error">{message}</p>}

      <div className="job-filters">
        <input
          aria-label="Search jobs"
          placeholder="Search jobs, skills, or companies"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select aria-label="Filter by location" value={location} onChange={(event) => setLocation(event.target.value)}>
          <option value="">All locations</option>
          {locations.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select aria-label="Filter by job type" value={jobType} onChange={(event) => setJobType(event.target.value)}>
          <option value="">All job types</option>
          <option value="INTERNSHIP">Internship</option>
          <option value="FULL_TIME">Full time</option>
          <option value="PART_TIME">Part time</option>
          <option value="CONTRACT">Contract</option>
          <option value="FREELANCE">Freelance</option>
        </select>
      </div>

      <div className="job-list">
        {filteredJobs.map((job) => {
          const application = applicationsByJob.get(job.id);
          return (
            <article className="job-item" key={job.id}>
              <div>
                <p className="eyebrow">{job.jobType}</p>
                <h3>{job.title}</h3>
                <p>{job.company?.name || 'Company'} · {job.location}</p>
                <p className="job-summary">{job.description}</p>
              </div>
              <div className="job-actions">
                <button type="button" className="text-link" onClick={() => openJob(job)}>View details</button>
                {application ? (
                  <span className={`status status-${String(application.status || 'PENDING').toLowerCase()}`}>
                    {application.status === 'PENDING' ? 'Applied · Pending' : application.status}
                  </span>
                ) : (
                  <button type="button" className="primary-action" onClick={() => openJob(job)}>Apply now</button>
                )}
              </div>
            </article>
          );
        })}

        {filteredJobs.length === 0 && <p className="empty-state">No opportunities match those filters.</p>}
      </div>

      {selectedJob && (
        <div className="job-dialog" role="dialog" aria-modal="true">
          <div className="job-dialog-card">
            <button className="dialog-close" type="button" onClick={() => setSelectedJob(null)}>Close</button>
            <p className="eyebrow">{selectedJob.jobType} · {selectedJob.location}</p>
            <h3>{selectedJob.title}</h3>
            <p>{selectedJob.company?.name || 'Company'}</p>
            <p className="job-description">{selectedJob.description}</p>
            <h4>Requirements</h4>
            <ul>{selectedJob.requirements?.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>

            {user && !applicationsByJob.has(selectedJob.id) ? (
              <form onSubmit={submitApplication}>
                <label>
                  Cover letter
                  <textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} maxLength="1000" required />
                </label>
                <label>
                  PDF resume
                  <input type="file" accept="application/pdf,.pdf" onChange={(event) => setResumeFile(event.target.files?.[0] || null)} />
                </label>
                <button className="primary-action" disabled={busy}>
                  {busy ? 'Submitting...' : 'Submit application'}
                </button>
              </form>
            ) : !user ? (
              <p className="dashboard-error">Log in as a User to apply for this opportunity.</p>
            ) : (
              <p className={`status status-${String(applicationsByJob.get(selectedJob.id)?.status || 'PENDING').toLowerCase()}`}>
                Application status: {applicationsByJob.get(selectedJob.id)?.status}
              </p>
            )}
          </div>
        </div>
      )}

      <Link to="/internships" className="text-link">Browse the public opportunities page →</Link>
    </section>
  );
}

export default JobExplorer;
