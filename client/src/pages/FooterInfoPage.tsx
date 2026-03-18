import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";

interface FooterContent {
  title: string;
  summary: string;
  body: string[];
}

const FOOTER_CONTENT: Record<string, Record<string, FooterContent>> = {
  product: {
    features: {
      title: "Features",
      summary: "Core capabilities available in Code Snippet Manager.",
      body: [
        "Create and organize snippets with categories, tags, and language metadata.",
        "Search quickly using text, filters, favorites, and sort options.",
        "Track changes through version history and share snippets securely with your team."
      ]
    },
    integrations: {
      title: "Integrations",
      summary: "Connect this workspace with your development flow.",
      body: [
        "Cloud sync keeps snippet state consistent across signed-in devices.",
        "API-key-ready account settings support future service integrations.",
        "The platform is designed for lightweight CI or editor extension hooks."
      ]
    },
    roadmap: {
      title: "Roadmap",
      summary: "Planned enhancements for upcoming releases.",
      body: [
        "Improved collaboration tools, including richer sharing controls.",
        "Advanced search relevance and metadata analytics for snippet usage.",
        "Expanded language tooling and deeper team workspace permissions."
      ]
    },
    changelog: {
      title: "Changelog",
      summary: "Release highlights and improvement tracking.",
      body: [
        "Navigation and profile flows were moved to dedicated pages for better structure.",
        "Landing page interactions were upgraded with popovers, badges, and footer sections.",
        "UI components were aligned for cleaner spacing, hierarchy, and production readiness."
      ]
    }
  },
  resources: {
    docs: {
      title: "Documentation",
      summary: "Guides for setup, usage, and workflow best practices.",
      body: [
        "Start with authentication, then create snippets with language and category metadata.",
        "Use dashboard filters, favorites, and search to retrieve code faster.",
        "Manage profile and account settings from dedicated routes."
      ]
    },
    api: {
      title: "API",
      summary: "Programmatic access patterns for snippet operations.",
      body: [
        "Authenticated endpoints support CRUD for snippets, tags, and categories.",
        "Shared snippet links are tokenized for safe external access.",
        "Account settings include API key entry points for secure integrations."
      ]
    },
    "help-center": {
      title: "Help Center",
      summary: "Troubleshooting and common workflow solutions.",
      body: [
        "Use profile tools to update avatar and personal details.",
        "Check account settings if permissions or access controls appear incorrect.",
        "Validate sync status and retry actions when offline changes are detected."
      ]
    },
    community: {
      title: "Community",
      summary: "Collaboration and shared learning resources.",
      body: [
        "Share reusable patterns and language-specific snippet conventions.",
        "Collect team feedback on categories, naming, and tagging standards.",
        "Publish examples that improve onboarding for new contributors."
      ]
    }
  },
  company: {
    about: {
      title: "About",
      summary: "Why this platform exists.",
      body: [
        "Code Snippet Manager focuses on reducing repeated coding effort for teams.",
        "The goal is a practical, fast, and clean workspace for reusable code knowledge.",
        "The product direction prioritizes reliability, clarity, and productivity."
      ]
    },
    blog: {
      title: "Blog",
      summary: "Product updates, engineering notes, and practical tutorials.",
      body: [
        "Read implementation stories behind new releases and UI refinements.",
        "Explore tips for organizing large snippet libraries at scale.",
        "Follow best practices for secure sharing and cloud sync workflows."
      ]
    },
    careers: {
      title: "Careers",
      summary: "Open roles and team culture.",
      body: [
        "We value engineers who care about usability and high-quality tooling.",
        "Collaboration, ownership, and steady product delivery are core expectations.",
        "Current hiring updates are published here when openings are available."
      ]
    },
    contact: {
      title: "Contact",
      summary: "How to reach support and product teams.",
      body: [
        "Use this page for product questions, enterprise requests, and feedback.",
        "Support requests should include environment details for faster resolution.",
        "Feature suggestions are reviewed for roadmap planning."
      ]
    }
  },
  legal: {
    "privacy-policy": {
      title: "Privacy Policy",
      summary: "How account and snippet-related data is handled.",
      body: [
        "User profile details are used to personalize account experiences.",
        "Uploaded avatar images remain client-managed in local browser storage.",
        "Sensitive credentials such as passwords are never displayed in profile views."
      ]
    },
    "terms-and-conditions": {
      title: "Terms and Conditions",
      summary: "Usage expectations and service boundaries.",
      body: [
        "Users are responsible for content they store and share through the platform.",
        "Role-based controls define access permissions for restricted operations.",
        "Service capabilities may evolve with product updates and maintenance windows."
      ]
    },
    cookies: {
      title: "Cookies",
      summary: "Session and preference behavior for the web experience.",
      body: [
        "Session data helps maintain authenticated navigation during active use.",
        "Preference values are used to preserve UI choices and workflow continuity.",
        "Users can clear browser data at any time to reset local state."
      ]
    },
    security: {
      title: "Security",
      summary: "Data protection and account access practices.",
      body: [
        "Authentication is required for protected dashboard routes and snippet editing.",
        "Role labels and account controls are surfaced in profile and settings pages.",
        "Security improvements are delivered incrementally through continuous updates."
      ]
    }
  }
};

const SECTION_LABELS: Record<string, string> = {
  product: "Product",
  resources: "Resources",
  company: "Company",
  legal: "Legal"
};

function toTitle(value: string): string {
  return value
    .split("-")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(" ");
}

type FooterSection = "product" | "resources" | "company" | "legal";

interface FooterInfoPageProps {
  section: FooterSection;
}

export function FooterInfoPage({ section }: FooterInfoPageProps) {
  const navigate = useNavigate();
  const { page } = useParams<{ page: string }>();

  const content = useMemo(() => {
    if (!section || !page) {
      return null;
    }

    return FOOTER_CONTENT[section]?.[page] ?? null;
  }, [section, page]);

  const sectionLabel = SECTION_LABELS[section] ?? toTitle(section);
  const pageLabel = page ? toTitle(page) : "Page";

  return (
    <main className="footer-info-layout">
      <section className="panel footer-info-panel">
        <header className="footer-info-header">
          <p className="footer-info-crumb">{sectionLabel} / {pageLabel}</p>
          {content ? <h2>{content.title}</h2> : <h2>Page Not Found</h2>}
          <p className="muted">
            {content
              ? content.summary
              : "This footer destination is not available yet. Use the actions below to continue."}
          </p>
        </header>

        <div className="footer-info-content">
          {content ? (
            content.body.map((line) => (
              <p key={line} className="footer-info-line">
                {line}
              </p>
            ))
          ) : (
            <p className="footer-info-line">Requested route: /{section ?? ""}/{page ?? ""}</p>
          )}
        </div>

        <footer className="footer-info-actions">
          <Button variant="secondary" onClick={() => navigate("/")}>
            Back to Home
          </Button>
          <Button variant="primary" onClick={() => navigate("/dashboard")}>
            Open Dashboard
          </Button>
        </footer>
      </section>
    </main>
  );
}

