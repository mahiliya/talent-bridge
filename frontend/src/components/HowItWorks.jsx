import './Landing.css';

// Explains BOTH sides of the platform so the public landing page communicates
// the full value: students/graduates find and track opportunities, while
// companies post roles and manage applicants.
function HowItWorks() {
  const studentSteps = [
    'Create your account',
    'Complete your profile',
    'Discover matched internships',
    'Apply to opportunities',
    'Track your applications',
  ];

  const companySteps = [
    'Create a company account',
    'Create your company profile',
    'Post internship opportunities',
    'Review applicants and match scores',
    'Shortlist, accept, or reject candidates',
  ];

  return (
    <section className="landing-section how-it-works" id="how-it-works">
      <div className="landing-container">
        <div className="landing-heading">
          <h2>How Talent Bridge Works</h2>
          <p>One platform, two journeys — connecting students and graduates with the companies hiring them.</p>
        </div>

        <div className="workflows-grid">
          <article className="workflow-card workflow-student">
            <h3 className="workflow-title">For Students &amp; Graduates</h3>
            <ol className="workflow-steps">
              {studentSteps.map((step, i) => (
                <li key={step}>
                  <span className="workflow-step-num">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className="workflow-card workflow-company">
            <h3 className="workflow-title">For Companies</h3>
            <ol className="workflow-steps">
              {companySteps.map((step, i) => (
                <li key={step}>
                  <span className="workflow-step-num">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
