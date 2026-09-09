import "./CategorySection.css"
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
  // Updated data for categories with realistic internship fields
  const categories = [
    {
      id: 1,
      name: "Frontend Development",
      icon: "frontend",
      count: 235,
      description: "Web UI, React, Vue, Angular",
    },
    {
      id: 2,
      name: "Backend Development",
      icon: "backend",
      count: 186,
      description: "Node.js, Python, Java, APIs",
    },
    {
      id: 3,
      name: "Digital Marketing",
      icon: "marketing",
      count: 140,
      highlighted: true,
      description: "SEO, Social Media, Content",
    },
    {
      id: 4,
      name: "Graphic Design",
      icon: "design",
      count: 125,
      description: "Branding, Illustration, Print",
    },
    {
      id: 5,
      name: "Data Science",
      icon: "data",
      count: 98,
      description: "Analytics, ML, Visualization",
    },
    {
      id: 6,
      name: "UI/UX Design",
      icon: "uiux",
      count: 142,
      description: "User Research, Wireframing",
    },
    {
      id: 7,
      name: "Accounting & Finance",
      icon: "finance",
      count: 76,
      description: "Bookkeeping, Financial Analysis",
    },
    {
      id: 8,
      name: "Project Management",
      icon: "project",
      count: 111,
      description: "Agile, Scrum, Coordination",
    },
  ]

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
          <a href="/internships" className="section-show-all">
            Show all internships <span className="arrow-icon">→</span>
          </a>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <a
              href={`/category/${category.name.toLowerCase().replace(/\s+/g, "-")}`}
              key={category.id}
              className={`category-card ${category.highlighted ? "category-card-highlighted" : ""}`}
            >
              <div className="category-icon">{getIcon(category.icon)}</div>
              <h3 className="category-name">{category.name}</h3>
              <p className="category-description">{category.description}</p>
              <p className="category-count">
                <span className="count-number">{category.count}</span> internships available{" "}
                <span className="arrow-icon">→</span>
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategorySection

