import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Heart, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

const navLinks = [
  { to: "/therapists", label: "Find a Therapist" },
  { to: "/about", label: "About" },
  { to: "/faqs", label: "FAQs" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const dashboardLink =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "therapist"
        ? "/therapist/dashboard"
        : user?.role === "client"
          ? "/dashboard"
          : null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="h-7 w-7 fill-primary-600 text-primary-600" />
          <span className="font-display text-xl font-bold text-slate-900">TherapyConnect</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium transition",
                  isActive ? "text-primary-700" : "text-slate-600 hover:text-primary-700"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {dashboardLink && (
                <Link to={dashboardLink} className="btn-secondary gap-2 py-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="btn-secondary gap-2 py-2">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary-700">
                Log in
              </Link>
              <Link to="/register" className="btn-primary py-2">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-slate-600 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-slate-700"
              >
                {link.label}
              </NavLink>
            ))}
            {!user && (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium">
                  Log in
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
            {user && dashboardLink && (
              <Link to={dashboardLink} onClick={() => setMobileOpen(false)} className="text-sm font-medium">
                Dashboard
              </Link>
            )}
            {user && (
              <button onClick={handleLogout} className="text-left text-sm font-medium text-red-600">
                Logout
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 fill-primary-400 text-primary-400" />
              <span className="font-display text-lg font-bold text-white">TherapyConnect</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              Connecting you with qualified therapists in your area. Your mental health journey starts here.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white">Explore</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/therapists" className="hover:text-white">Find a Therapist</Link></li>
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/faqs" className="hover:text-white">FAQs</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">For Therapists</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/register/therapist" className="hover:text-white">Join Our Directory</Link></li>
              <li><Link to="/login" className="hover:text-white">Therapist Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-sm">
          © {new Date().getFullYear()} TherapyConnect. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
