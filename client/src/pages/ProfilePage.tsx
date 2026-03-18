import { useEffect, useMemo, useRef, useState } from "react";
import { AppNavbar } from "../components/AppNavbar";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";

function avatarStorageKey(userId: string | undefined): string {
  return `snippet_manager_avatar_${userId ?? "guest"}`;
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

export function ProfilePage() {
  const { user } = useAuth();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const memberSince = useMemo(() => {
    const key = `snippet_manager_member_since_${user?.id ?? "guest"}`;

    if (user?.createdAt) {
      return user.createdAt;
    }

    const existing = localStorage.getItem(key);

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    localStorage.setItem(key, now);
    return now;
  }, [user?.createdAt, user?.id]);

  useEffect(() => {
    const key = avatarStorageKey(user?.id);
    setAvatarUrl(localStorage.getItem(key));
  }, [user?.id]);

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;

      if (!dataUrl) {
        return;
      }

      const key = avatarStorageKey(user?.id);
      localStorage.setItem(key, dataUrl);
      setAvatarUrl(dataUrl);
      window.dispatchEvent(new Event("avatar-updated"));
    };

    reader.readAsDataURL(file);
  };

  const deletePhoto = () => {
    const key = avatarStorageKey(user?.id);
    localStorage.removeItem(key);
    setAvatarUrl(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    window.dispatchEvent(new Event("avatar-updated"));
  };

  return (
    <main className="dashboard-layout">
      <AppNavbar showSearch={false} />

      <section className="panel page-panel profile-page-panel">
        <header className="page-header-row">
          <h2>My Profile</h2>
          <p className="muted">Manage personal details and optional avatar photo.</p>
        </header>

        <div className="profile-layout">
          <div className="profile-avatar-block">
            <div className="profile-avatar-large">
              {avatarUrl ? <img src={avatarUrl} alt="Profile" className="avatar-image" /> : initials(user?.name)}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={onFileSelected}
              className="hidden-input"
            />

            <div className="inline-actions">
              <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                Upload Photo
              </Button>
              <Button variant="danger" onClick={deletePhoto} disabled={!avatarUrl}>
                Delete Photo
              </Button>
            </div>

            <p className="muted small">Optional. Existing profile photo remains unchanged if no file is selected.</p>
          </div>

          <div className="profile-details-grid">
            <div className="profile-detail-item">
              <span className="muted small">Full Name</span>
              <strong>{user?.name ?? "-"}</strong>
            </div>
            <div className="profile-detail-item">
              <span className="muted small">Username / Email</span>
              <strong>{user?.username ?? user?.email ?? "-"}</strong>
            </div>
            <div className="profile-detail-item">
              <span className="muted small">Role</span>
              <strong>{user?.role ?? "-"}</strong>
            </div>
            <div className="profile-detail-item">
              <span className="muted small">Member Since</span>
              <strong>{new Date(memberSince).toLocaleDateString()}</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

