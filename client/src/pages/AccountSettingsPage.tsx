import { useEffect, useState } from "react";
import { AppNavbar } from "../components/AppNavbar";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { useCloudSync } from "../hooks/useCloudSync";

function createApiKey(): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;

  return `sk_live_${random}`;
}

export function AccountSettingsPage() {
  const { token, user, updateLocalUser } = useAuth();
  const { markLocalChanges } = useCloudSync(token);

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [username, setUsername] = useState(user?.username ?? (user?.email?.split("@")[0] ?? ""));
  const [notifications, setNotifications] = useState<boolean>(() => {
    return localStorage.getItem(`snippet_manager_notify_${user?.id ?? "guest"}`) !== "false";
  });
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const apiKeyStorageKey = `snippet_manager_api_key_${user?.id ?? "guest"}`;

  useEffect(() => {
    setApiKey(localStorage.getItem(apiKeyStorageKey) ?? "");
  }, [apiKeyStorageKey]);

  const saveSettings = () => {
    updateLocalUser({
      name: fullName,
      email,
      username
    });

    localStorage.setItem(`snippet_manager_notify_${user?.id ?? "guest"}`, notifications ? "true" : "false");
    markLocalChanges();
    setMessage("Account settings saved locally.");
  };

  const generateApiKey = () => {
    const next = createApiKey();
    localStorage.setItem(apiKeyStorageKey, next);
    setApiKey(next);
    markLocalChanges();
    setMessage("API key generated.");
  };

  const copyApiKey = async () => {
    if (!apiKey) {
      return;
    }

    await navigator.clipboard.writeText(apiKey);
    setMessage("API key copied to clipboard.");
  };

  const revokeApiKey = () => {
    localStorage.removeItem(apiKeyStorageKey);
    setApiKey("");
    markLocalChanges();
    setMessage("API key revoked.");
  };

  return (
    <main className="dashboard-layout">
      <AppNavbar showSearch={false} />

      <section className="panel page-panel settings-page-panel">
        <header className="page-header-row">
          <h2>Account Settings</h2>
          <p className="muted">Update basic profile information and account controls.</p>
        </header>

        <div className="settings-grid">
          <section className="settings-section">
            <h3>Basic Information</h3>

            <label>
              <span className="label-title">Full Name</span>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </label>

            <label>
              <span className="label-title">Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>

            <label>
              <span className="label-title">Username</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(event) => setNotifications(event.target.checked)}
              />
              Email notifications
            </label>

            <div className="settings-actions">
              <Button variant="primary" onClick={saveSettings}>
                Save Settings
              </Button>
            </div>
          </section>

          <section id="api-keys" className="settings-section">
            <h3>API Keys</h3>
            <p className="muted small">Generate and manage an API key for integration access.</p>

            <label>
              <span className="label-title">Active Key</span>
              <input value={apiKey} readOnly placeholder="No API key generated" />
            </label>

            <div className="inline-actions">
              <Button variant="secondary" onClick={generateApiKey}>
                {apiKey ? "Regenerate" : "Generate"}
              </Button>
              <Button variant="ghost" onClick={() => void copyApiKey()} disabled={!apiKey}>
                Copy
              </Button>
              <Button variant="danger" onClick={revokeApiKey} disabled={!apiKey}>
                Revoke
              </Button>
            </div>
          </section>

          {message ? <p className="muted">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}

