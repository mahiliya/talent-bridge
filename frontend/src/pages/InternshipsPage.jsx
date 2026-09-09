import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./InternshipsPage.css";
import InternshipCard from "../components/InternshipCard";

const API_URL = "http://localhost:3000/api";

// Turn backend enum values like FULL_TIME / ENTRY_LEVEL into "Full Time" / "Entry Level".
const humanize = (value) =>
  String(value || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function InternshipsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Most relevant");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const internshipsPerPage = 10; // Adjust this number to configure the number of internships per page

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await fetch(`${API_URL}/jobs`);
        if (!response.ok) {
          throw new Error("Unable to load opportunities right now.");
        }
        setJobs(await response.json());
      } catch (error) {
        setLoadError(error.message || "Unable to load opportunities right now.");
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  // Map real backend jobs to the shape this page renders.
  const internships = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    organization: job.company?.name || "Company",
    location: job.location || "",
    description: job.description || "",
    tags: [humanize(job.jobType), humanize(job.experienceLevel)].filter(Boolean),
    postedDate: job.postedAt,
    deadline: job.deadline,
  }));

  // Get all unique categories and locations for filters
  const allCategories = [...new Set(internships.flatMap(internship => internship.tags))];
  const allLocations = [...new Set(internships.map(internship => internship.location))];

  // Filter internships based on search term and selected filters
  const filteredInternships = internships.filter((internship) => {
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategories = selectedCategories.length === 0 ||
      internship.tags.some(tag => selectedCategories.includes(tag));

    const matchesLocations = selectedLocations.length === 0 ||
      selectedLocations.includes(internship.location);

    return matchesSearch && matchesCategories && matchesLocations;
  });

  // Sort internships based on selected option
  const sortedInternships = [...filteredInternships].sort((a, b) => {
    if (sortBy === 'Newest') {
      return new Date(b.postedDate) - new Date(a.postedDate);
    } else if (sortBy === 'Oldest') {
      return new Date(a.postedDate) - new Date(b.postedDate);
    } else if (sortBy === 'Deadline (soonest)') {
      return new Date(a.deadline) - new Date(b.deadline);
    } else {
      return 0; // Most Relevant (no change in order)
    }
  });

  // Pagination logic
  const indexOfLastInternship = currentPage * internshipsPerPage;
  const indexOfFirstInternship = indexOfLastInternship - internshipsPerPage;
  const currentInternships = sortedInternships.slice(indexOfFirstInternship, indexOfLastInternship);

  const totalPages = Math.ceil(sortedInternships.length / internshipsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Function to handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Function to handle sort change
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  // Function to handle category filter change
  const handleCategoryChange = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Function to handle location filter change
  const handleLocationChange = (location) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  // Function to clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSortBy('Most relevant');
  };

  return (
    <div className="internships-page">
      <div className="internships-container">
        <div className="back-to-home">
          <Link to="/" className="back-link">
            ← Back
          </Link>
        </div>

        <header className="page-header">
          <h1 className="page-title">Explore Opportunities</h1>
          <p className="page-subtitle">Find the perfect internship or volunteer opportunity to match your skills and interests</p>
        </header>

        <div className="search-section">
          <div className="search-container">
            <span className="search-icon"></span>
            <input
              type="text"
              placeholder="Search by title, organization, or keywords..."
              className="search-input"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                ×
              </button>
            )}
          </div>
        </div>

        <div className="internships-content">
          {/* Filters Sidebar */}
          <aside className="filters-sidebar">
            <div className="filters-header">
              <h2>Filters</h2>
              {(selectedCategories.length > 0 || selectedLocations.length > 0) && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Clear all
                </button>
              )}
            </div>

            <div className="filter-group">
              <h3>Categories</h3>
              <div className="filter-options">
                {allCategories.map(category => (
                  <label key={category} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                    />
                    <span className="checkmark"></span>
                    {category}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h3>Location</h3>
              <div className="filter-options">
                {allLocations.map(location => (
                  <label key={location} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedLocations.includes(location)}
                      onChange={() => handleLocationChange(location)}
                    />
                    <span className="checkmark"></span>
                    {location}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="internships-main">
            <div className="internships-header">
              <div className="results-count">
                Showing <span>{sortedInternships.length}</span> opportunities
              </div>
              <div className="sort-controls">
                <label htmlFor="sort-by">Sort by:</label>
                <select id="sort-by" value={sortBy} onChange={handleSortChange} className="sort-select">
                  <option>Most relevant</option>
                  <option>Newest</option>
                  <option>Oldest</option>
                  <option>Deadline (soonest)</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedCategories.length > 0 || selectedLocations.length > 0) && (
              <div className="active-filters">
                <span className="active-filters-label">Active filters:</span>
                <div className="filter-tags">
                  {selectedCategories.map(category => (
                    <span key={category} className="filter-tag">
                      {category}
                      <button onClick={() => handleCategoryChange(category)}>×</button>
                    </span>
                  ))}
                  {selectedLocations.map(location => (
                    <span key={location} className="filter-tag location-tag">
                      {location}
                      <button onClick={() => handleLocationChange(location)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Internships List */}
            {loading ? (
              <div className="no-results">
                <h3>Loading opportunities...</h3>
              </div>
            ) : loadError ? (
              <div className="no-results">
                <h3>{loadError}</h3>
              </div>
            ) : sortedInternships.length > 0 ? (
              <div className="internships-grid">
                {currentInternships.map((internship) => (
                  <Link to={`/internships/${internship.id}`} key={internship.id} className="internship-link">
                    <InternshipCard internship={internship} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-icon"></div>
                <h3>No opportunities found</h3>
                <p>Try adjusting your search or filters to find what you're looking for.</p>
                <button className="reset-search-btn" onClick={clearFilters}>
                  Reset all filters
                </button>
              </div>
            )}

            {/* Pagination Component */}
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-btn prev-btn"
              >
                Prev
              </button>

              {/* Generate page number buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`page-btn ${currentPage === pageNumber ? 'active' : ''}`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-btn next-btn"
              >
                Next
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default InternshipsPage;