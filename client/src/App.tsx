import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AccountSettingsPage } from "./pages/AccountSettingsPage";
import { CreateSnippetPage } from "./pages/CreateSnippetPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FooterInfoPage } from "./pages/FooterInfoPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { SharedSnippetPage } from "./pages/SharedSnippetPage";
import { SnippetDetailPage } from "./pages/SnippetDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/shared/:token" element={<SharedSnippetPage />} />

      <Route path="/product/:page" element={<FooterInfoPage section="product" />} />
      <Route path="/resources/:page" element={<FooterInfoPage section="resources" />} />
      <Route path="/company/:page" element={<FooterInfoPage section="company" />} />
      <Route path="/legal/:page" element={<FooterInfoPage section="legal" />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-snippet"
        element={
          <ProtectedRoute>
            <CreateSnippetPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account-settings"
        element={
          <ProtectedRoute>
            <AccountSettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/snippets/:id"
        element={
          <ProtectedRoute>
            <SnippetDetailPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
