import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";

type HomeMenu = "notifications" | "profile" | "more";

interface UtilityIconProps {
  label: string;
  children: ReactNode;
  onClick: () => void;
  isActive?: boolean;
  badgeCount?: number;
}

function UtilityIcon({ label, children, onClick, isActive = false, badgeCount = 0 }: UtilityIconProps) {
  return (
    <button
      type="button"
      className={`home-utility-icon${isActive ? " is-active" : ""}`}
      aria-label={label}
      aria-expanded={isActive}
      onClick={onClick}
    >
      {children}
      {badgeCount > 0 ? <span className="home-icon-badge">{badgeCount > 99 ? "99+" : badgeCount}</span> : null}
    </button>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [activeMenu, setActiveMenu] = useState<HomeMenu | null>(null);

  const closeMenu = () => setActiveMenu(null);

  useEffect(() => {
    if (!activeMenu) {
      return;
    }

    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (toolbarRef.current?.contains(target)) {
        return;
      }

      closeMenu();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onEscape);
    };
  }, [activeMenu]);

  const toggleMenu = (menu: HomeMenu) => {
    setActiveMenu((previous) => (previous === menu ? null : menu));
  };

  const go = (path: string) => {
    closeMenu();
    navigate(path);
  };

  const signOut = () => {
    closeMenu();
    logout();
    navigate("/login");
  };

  return (
    <main className="home-layout">
      <section className="home-frame">
        <header className="home-topbar">
          <div className="home-brand">
            <span className="home-brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M9 6L5 12l4 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 6l4 6-4 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M13 5l-2 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <h1>Code Snippet Manager</h1>
          </div>

          <div className="home-header-actions">
            <Button
              variant="secondary"
              className="home-top-btn home-top-btn-secondary"
              onClick={() => navigate("/dashboard")}
            >
              Open Dashboard
            </Button>
            <Button
              variant="primary"
              className="home-top-btn home-top-btn-primary"
              onClick={() => navigate("/create-snippet")}
            >
              Create Snippet
            </Button>
          </div>

          <div className="home-toolbar" ref={toolbarRef}>
            <UtilityIcon
              label="Notifications"
              onClick={() => toggleMenu("notifications")}
              isActive={activeMenu === "notifications"}
              badgeCount={3}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 4a6 6 0 00-6 6v3.2l-1.4 2.3h14.8L18 13.2V10a6 6 0 00-6-6z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.5 18a2.5 2.5 0 005 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </UtilityIcon>

            <UtilityIcon label="Filters" onClick={() => navigate("/dashboard#filters")}> 
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 6h16M7 12h10M10 18h4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </UtilityIcon>

            <span className="home-toolbar-divider" />

            <UtilityIcon label="Starred snippets" onClick={() => navigate("/dashboard?favorites=1")} badgeCount={2}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 3.8l2.6 5.2 5.7.8-4.1 4 1 5.7L12 16.9 6.8 19.5l1-5.7-4.1-4 5.7-.8L12 3.8z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </UtilityIcon>

            <button
              type="button"
              className={`home-avatar-button${activeMenu === "profile" ? " is-active" : ""}`}
              aria-label="Profile menu"
              aria-expanded={activeMenu === "profile"}
              onClick={() => {
                if (!user) {
                  navigate("/login");
                  return;
                }

                toggleMenu("profile");
              }}
            >
              {user?.name?.slice(0, 1).toUpperCase() ?? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M5.5 19a6.5 6.5 0 0113 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>

            <UtilityIcon
              label="More options"
              onClick={() => toggleMenu("more")}
              isActive={activeMenu === "more"}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="5" cy="12" r="1.6" fill="currentColor" />
                <circle cx="12" cy="12" r="1.6" fill="currentColor" />
                <circle cx="19" cy="12" r="1.6" fill="currentColor" />
              </svg>
            </UtilityIcon>

            <div
              className={`home-menu-panel${activeMenu === "notifications" ? " is-open" : ""}`}
              role="menu"
              aria-hidden={activeMenu !== "notifications"}
            >
              <p className="home-menu-title">Notifications</p>
              <div className="home-menu-list">
                <p className="home-menu-line">3 new notifications are waiting.</p>
                <p className="home-menu-line">Draft autosave is enabled.</p>
                <p className="home-menu-line">Use Ctrl+K in dashboard for instant search.</p>
              </div>
              <button type="button" className="home-menu-action" onClick={() => go("/dashboard")}>
                Open Dashboard
              </button>
            </div>

            <div
              className={`home-menu-panel${activeMenu === "profile" ? " is-open" : ""}`}
              role="menu"
              aria-hidden={activeMenu !== "profile"}
            >
              {user ? (
                <>
                  <p className="home-menu-title">{user.name}</p>
                  <p className="home-menu-subtitle">{user.email} • {user.role}</p>
                  <button type="button" className="home-menu-action" onClick={() => go("/profile")}>
                    My Profile
                  </button>
                  <button type="button" className="home-menu-action" onClick={() => go("/account-settings")}>
                    Account Settings
                  </button>
                  <button type="button" className="home-menu-action home-menu-action-danger" onClick={signOut}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <p className="home-menu-title">Account</p>
                  <p className="home-menu-subtitle">Sign in to access your profile and settings.</p>
                  <button type="button" className="home-menu-action" onClick={() => go("/login")}>
                    Sign In
                  </button>
                  <button type="button" className="home-menu-action" onClick={() => go("/register")}>
                    Create Account
                  </button>
                </>
              )}
            </div>

            <div
              className={`home-menu-panel${activeMenu === "more" ? " is-open" : ""}`}
              role="menu"
              aria-hidden={activeMenu !== "more"}
            >
              <p className="home-menu-title">Quick Actions</p>
              <button type="button" className="home-menu-action" onClick={() => go("/dashboard")}>
                Open Dashboard
              </button>
              <button type="button" className="home-menu-action" onClick={() => go("/create-snippet")}>
                Create Snippet
              </button>
              <button type="button" className="home-menu-action" onClick={() => go("/account-settings#api-keys")}>
                API Keys
              </button>
            </div>
          </div>
        </header>

        <div className="home-stage">
          <div className="home-hero-content">
            <h2>Code Snippet Manager</h2>
            <p>Store, organize, and share your favorite code snippets.</p>


          </div>
        </div>

        <footer className="home-footer">
          <div className="home-footer-grid">
            <section className="home-footer-brand">
              <div className="home-footer-brand-head">
                <span className="home-footer-brand-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M9 6L5 12l4 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 6l4 6-4 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M13 5l-2 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <strong>Code Snippet Manager</strong>
              </div>
              <p className="home-footer-tagline">Reusable snippets, faster shipping, cleaner engineering workflows.</p>
              <p className="home-footer-copy">© {new Date().getFullYear()} Code Snippet Manager</p>
            </section>

            <section className="home-footer-col">
              <h3>Product</h3>
              <button type="button" className="home-footer-link" onClick={() => navigate("/product/features")}>Features</button>
              <button type="button" className="home-footer-link" onClick={() => navigate("/product/integrations")}>Integrations</button>
              <button type="button" className="home-footer-link" onClick={() => navigate("/product/roadmap")}>Roadmap</button>
              <button type="button" className="home-footer-link" onClick={() => navigate("/product/changelog")}>Changelog</button>
            </section>

            <section className="home-footer-col">
              <h3>Resources</h3>
              <button type="button" className="home-footer-link" onClick={() => navigate("/resources/docs")}>Docs</button>
              <button type="button" className="home-footer-link" onClick={() => navigate("/resources/api")}>API</button>
              <button type="button" className="home-footer-link" onClick={() => navigate("/resources/help-center")}>Help Center</button>
              <button type="button" className="home-footer-link" onClick={() => navigate("/resources/community")}>Community</button>
            </section>

            <section className="home-footer-col">
              <h3>Company</h3>
              <button type="button" className="home-footer-link" onClick={() => navigate("/company/about")}>About</button>
              <button type="button" className="home-footer-link" onClick={() => navigate("/company/blog")}>Blog</button>
              <button type="button" className="home-footer-link" onClick={() => navigate("/company/careers")}>Careers</button>
              <button type="button" className="home-footer-link" onClick={() => navigate("/company/contact")}>Contact</button>
            </section>
          </div>

          <div className="home-footer-legal">
            <button type="button" className="home-legal-link" onClick={() => navigate("/legal/privacy-policy")}>Privacy Policy</button>
            <button type="button" className="home-legal-link" onClick={() => navigate("/legal/terms-and-conditions")}>Terms & Conditions</button>
            <button type="button" className="home-legal-link" onClick={() => navigate("/legal/cookies")}>Cookies</button>
            <button type="button" className="home-legal-link" onClick={() => navigate("/legal/security")}>Security</button>
          </div>
        </footer>
      </section>
    </main>
  );
}

