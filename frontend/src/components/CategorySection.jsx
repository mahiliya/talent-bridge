import "./CategorySection.css"
import { useNavigate } from "react-router-dom"
import {
  Code,
  Database,
  Palette,
  LineChart,
  PenTool,
  BarChart2,
  Calculator,
  ClipboardList,
  Briefcase,
  Lightbulb,
} from "lucide-react"

function CategorySection() {
  const navigate = useNavigate()

  // Categories are informational on the public landing page. Actual job data
  // is never exposed here — clicking a category sends authenticated users to
  // the gated browsing page and everyone else to sign in first. Counts are
  // intentionally omitted because there is no real per-category count source.
  const categories = [
    { id: 1, name: "Frontend Development", icon: "frontend", description: "Web UI, React, Vue, Angular" },
    { id: 2, name: "Backend Development", icon: "backend", description: "Node.js, Python, Java, APIs" },
    { id: 3, name: "Digital Marketing", icon: "marketing", description: "SEO, Social Media, Content" },
    { id: 4, name: "Graphic Design", icon: "design", description: "Branding, Illustration, Print" },
    { id: 5, name: "Data Science", icon: "data", description: "Analytics, ML, Visualization" },
    { id: 6, name: "UI/UX Design", icon: "uiux", description: "User Research, Wireframing" },
    { id: 7, name: "Accounting & Finance", icon: "finance", description: "Bookkeeping, Financial Analysis" },
    { id: 8, name: "Project Management", icon: "project", description: "Agile, Scrum, Coordination" },
  ]

  // Categories point at the protected /category/:category route. ProtectedRoute
  // sends an unauthenticated visitor to /login (remembering this exact category
  // URL) and returns them here after sign-in; an authenticated visitor goes
  // straight to the filtered listing. Job data is never exposed on this page.
  const openCategory = (category) => {
    const slug = category.name.toLowerCase().replace(/\s+/g, "-")
    navigate(`/category/${slug}`)
  }

  // Function to return icon based on category
  const getIcon = (iconName) => {
    const iconProps = {
      size: 24,
      strokeWidth: 2,
    }

    switch (iconName) {
      case "frontend":
        return <Code {...iconProps} />
      case "backend":
        return <Database {...iconProps} />
      case "marketing":
        return <LineChart {...iconProps} />
      case "design":
        return <PenTool {...iconProps} />
      case "data":
        return <BarChart2 {...iconProps} />
      case "uiux":
        return <Palette {...iconProps} />
      case "finance":
        return <Calculator {...iconProps} />
      case "project":
        return <ClipboardList {...iconProps} />
      case "business":
        return <Briefcase {...iconProps} />
      case "innovation":
        return <Lightbulb {...iconProps} />
      default:
        return null
    }
  }

  return (
    <section className="category-section">
      <div className="section-container">
        <div className="category-section-header">
          <h2 className="section-title">
            Explore by <span className="section-title-highlight">category</span>
          </h2>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <button
              type="button"
              onClick={() => openCategory(category)}
              key={category.id}
              className="category-card"
            >
              <div className="category-icon">{getIcon(category.icon)}</div>
              <h3 className="category-name">{category.name}</h3>
              <p className="category-description">{category.description}</p>
              <p className="category-count">
                Explore opportunities <span className="arrow-icon">→</span>
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategorySection
