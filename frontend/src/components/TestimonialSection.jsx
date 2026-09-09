import React, { useState } from 'react';
import './TestimonialSection.css';

function TestimonialSection() {
  // State to manage testimonial input and form
  const [newTestimonial, setNewTestimonial] = useState({ name: '', message: '' });
  const [testimonials, setTestimonials] = useState([
    // Initial Testimonials
    { id: 1, name: 'Alice Smith', message: 'Great platform! It helped me land my dream internship.' },
    { id: 2, name: 'Bob Johnson', message: 'Easy to use and full of opportunities. Highly recommended!' },
  ]);

  // Function to handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTestimonial(prev => ({ ...prev, [name]: value }));
  };

  // Function to handle testimonial submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTestimonial.name.trim() !== '' && newTestimonial.message.trim() !== '') {
      setTestimonials(prev => [...prev, { id: Date.now(), ...newTestimonial }]);
      setNewTestimonial({ name: '', message: '' }); // Clear form
    } else {
      alert('Please fill out both your name and testimonial!');
    }
  };

  return (
    <section className="testimonial-section">
      <div className="section-container">
        <h2 className="section-title">Share Your Success Story</h2>
        <p className="section-description">Just add the section for please share us your testimony here</p>

        <form className="testimonial-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={newTestimonial.name}
            onChange={handleInputChange}
            placeholder="Your Name"
            className="form-input"
          />
          <textarea
            name="message"
            value={newTestimonial.message}
            onChange={handleInputChange}
            placeholder="Your Testimonial"
            className="form-textarea"
          />
          <button type="submit" className="form-submit">
            Submit Testimonial
          </button>
        </form>

        <div className="testimonials-display">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <h3 className="testimonial-name">{testimonial.name}</h3>
              <p className="testimonial-message">{testimonial.message}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialSection;