import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { useAuth } from "../context/AuthContext";

interface DropdownPosition {
  top: number;
  left: number;
}

interface AppNavbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  showSearch?: boolean;
}

function initials(name: string | undefined): string {
  if (!name) {
    return "U";
  }

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarStorageKey(userId: string | undefined): string {
  return `snippet_manager_avatar_${userId ?? "guest"}`;
}

export function AppNavbar({ searchValue, onSearchChange, onSearchSubmit, showSearch = true }: AppNavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profilePosition, setProfilePosition] = useState<DropdownPosition | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const avatarButtonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const updateDropdownPosition = () => {
    const avatar = avatarButtonRef.current;

    if (!avatar) {
      return;
    }

    const rect = avatar.getBoundingClientRect();
    const width = 300;

    setProfilePosition({
      top: rect.bottom + window.scrollY + 8,
      left: Math.max(12, rect.right + window.scrollX - width)
    });
  };

  const closeProfileMenu = () => {
    setIsProfileOpen(false);
  };

  const navigateFromMenu = (path: string) => {
    closeProfileMenu();
    navigate(path);
  };

  useEffect(() => {
    const key = avatarStorageKey(user?.id);
    setAvatarUrl(localStorage.getItem(key));

    const onAvatarUpdated = () => {
      setAvatarUrl(localStorage.getItem(key));
    };

    window.addEventListener("storage", onAvatarUpdated);
    window.addEventListener("avatar-updated", onAvatarUpdated);

    return () => {
      window.removeEventListener("storage", onAvatarUpdated);
      window.removeEventListener("avatar-updated", onAvatarUpdated);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isProfileOpen) {
      return;
    }

    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (avatarButtonRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }

      closeProfileMenu();
    };

    const onViewport = () => updateDropdownPosition();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeProfileMenu();
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("resize", onViewport);
    window.addEventListener("scroll", onViewport, true);
    window.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("resize", onViewport);
      window.removeEventListener("scroll", onViewport, true);
      window.removeEventListener("keydown", onEscape);
    };
  }, [isProfileOpen]);

  const toggleProfileMenu = () => {
    if (isProfileOpen) {
      closeProfileMenu();
      return;
    }

    updateDropdownPosition();
    setIsProfileOpen(true);
  };

  const performSignOut = () => {
    closeProfileMenu();
    logout();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="navbar-brand-top">
        <button type="button" className="navbar-logo-button" onClick={() => navigate("/dashboard")}>
          <span className="navbar-logo-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <defs>
                <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#59f0d7" />
                  <stop offset="100%" stopColor="#2caea1" />
                </linearGradient>
              </defs>
              <path
                d="M22 16L10 32l12 16"
                fill="none"
                stroke="url(#logoGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M42 16l12 16-12 16"
                fill="none"
                stroke="url(#logoGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M30 46l4-28" fill="none" stroke="#d9fff8" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="navbar-logo-copy">
            <span className="navbar-logo-title">Code Snippet Manager</span>
            <span className="navbar-logo-subtitle">Developer Workspace</span>
          </span>
        </button>
      </div>

      <div className={`navbar-main-row${showSearch ? "" : " no-search"}`}>
        <div className="navbar-main-left">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Home</Button>
        </div>

        {showSearch ? (
          <div className="navbar-search-shell">
            <form
              className="navbar-search"
              onSubmit={(event) => {
                event.preventDefault();
                onSearchSubmit?.();
              }}
            >
              <input
                value={searchValue ?? ""}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder="Search snippets"
                aria-label="Search snippets"
              />
            </form>
          </div>
        ) : null}

        <div className="navbar-right">
          <Button variant="primary" onClick={() => navigate("/create-snippet")}>Create Snippet</Button>
          <button
            type="button"
            ref={avatarButtonRef}
            className="avatar-button"
            onClick={toggleProfileMenu}
            aria-expanded={isProfileOpen}
            aria-label="Open account menu"
          >
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="avatar-image" /> : initials(user?.name)}
          </button>
        </div>
      </div>

      {isProfileOpen && profilePosition
        ? createPortal(
            <div
              ref={dropdownRef}
              className="profile-dropdown"
              style={{ top: profilePosition.top, left: profilePosition.left }}
              role="menu"
            >
              <div className="profile-user">
                <div className="profile-user-avatar">
                  {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="avatar-image" /> : initials(user?.name)}
                </div>
                <div className="profile-user-info">
                  <strong>{user?.name ?? "User"}</strong>
                  <span className="muted small">{user?.email ?? ""}</span>
                  <span className="role-pill">{user?.role ?? "UNKNOWN"}</span>
                </div>
              </div>

              <button type="button" className="dropdown-action" onClick={() => navigateFromMenu("/profile")}>
                My Profile
              </button>
              <button type="button" className="dropdown-action" onClick={() => navigateFromMenu("/account-settings")}>
                Account Settings
              </button>
              <button
                type="button"
                className="dropdown-action"
                onClick={() => navigateFromMenu("/account-settings#api-keys")}
              >
                API Keys
              </button>

              <div className="divider" />

              <button type="button" className="dropdown-action dropdown-danger" onClick={performSignOut}>
                Sign Out
              </button>
            </div>,
            document.body
          )
        : null}
    </header>
  );
}

