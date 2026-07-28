import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ChatSocketProvider } from "./context/ChatSocketContext";
import { NotificationToasts } from "./components/NotificationToasts";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FAQsPage from "./pages/FAQsPage";
import DirectoryPage from "./pages/DirectoryPage";
import TherapistDetailPage from "./pages/TherapistDetailPage";
import BookingPage from "./pages/BookingPage";
import LoginPage, { RegisterPage } from "./pages/AuthPages";
import TherapistRegisterPage from "./pages/TherapistRegisterPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";
import TherapistDashboardPage from "./pages/TherapistDashboardPage";
import AdminPage from "./pages/AdminPage";
import { ForgotPasswordPage, ResetPasswordPage } from "./pages/PasswordPages";
import { PrivacyPage, TermsPage } from "./pages/LegalPages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatSocketProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faqs" element={<FAQsPage />} />
              <Route path="/therapists" element={<DirectoryPage />} />
              <Route path="/therapists/:slug" element={<TherapistDetailPage />} />
              <Route path="/book/:therapistSlug" element={<BookingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register/therapist" element={<TherapistRegisterPage />} />
              <Route path="/dashboard" element={<ClientDashboardPage />} />
              <Route path="/therapist/dashboard" element={<TherapistDashboardPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <NotificationToasts />
          </BrowserRouter>
        </ChatSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
