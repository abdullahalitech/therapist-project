import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Shield, Calendar, Star, ArrowRight } from "lucide-react";
import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { TherapistCard } from "../components/TherapistCard";
import { api } from "../lib/api";

export default function LandingPage() {
  const { data: featured = [] } = useQuery({
    queryKey: ["featured-therapists"],
    queryFn: api.getFeaturedTherapists,
  });

  return (
    <Layout>
      <SEO
        title="Find Your Therapist"
        description="Browse qualified therapists near you. Read reviews, compare specialties, and book appointments with ease."
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-teal-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxNGI4YTYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Find the right therapist for{" "}
              <span className="text-primary-600">your journey</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Browse verified therapists, read real reviews, and request appointments — all in one trusted directory.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/therapists" className="btn-primary gap-2 px-8 py-3 text-base">
                <Search className="h-5 w-5" />
                Browse Therapists
              </Link>
              <Link to="/register/therapist" className="btn-outline gap-2 px-8 py-3 text-base">
                Join as Therapist
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-200 bg-white py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
          {[
            { value: "500+", label: "Verified Therapists" },
            { value: "10k+", label: "Happy Clients" },
            { value: "4.8", label: "Average Rating" },
            { value: "50+", label: "Cities Covered" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary-700">{stat.value}</div>
              <div className="mt-1 text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">Three simple steps to start your therapy journey</p>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Search & Filter",
                desc: "Browse therapists by location, specialty, session type, and ratings to find your perfect match.",
              },
              {
                icon: Calendar,
                title: "Request a Session",
                desc: "Submit a booking request with your preferred date and time. The therapist will confirm your appointment.",
              },
              {
                icon: Star,
                title: "Leave a Review",
                desc: "After your session, share your experience to help others find the right therapist.",
              },
            ].map((step) => (
              <div key={step.title} className="card text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                  <step.icon className="h-7 w-7 text-primary-700" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured therapists */}
      {featured.length > 0 && (
        <section className="bg-slate-100 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="section-title">Featured Therapists</h2>
                <p className="section-subtitle">Top-rated professionals ready to help</p>
              </div>
              <Link to="/therapists" className="hidden btn-outline sm:inline-flex">
                View All
              </Link>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((t) => (
                <TherapistCard key={t.id} therapist={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="card flex flex-col items-center gap-6 bg-primary-900 p-10 text-center text-white md:flex-row md:text-left">
            <Shield className="h-16 w-16 shrink-0 text-primary-300" />
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold">Verified & Trusted</h2>
              <p className="mt-2 text-primary-100">
                Every therapist on our platform is reviewed and approved by our team. Your privacy and safety are our top priorities.
              </p>
            </div>
            <Link to="/about" className="btn-primary shrink-0 bg-white text-primary-900 hover:bg-primary-50">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary-600 to-teal-600 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-white">Ready to take the first step?</h2>
          <p className="mt-4 text-primary-100">
            Finding the right therapist can change everything. Start browsing today — it's free.
          </p>
          <Link to="/therapists" className="mt-8 inline-flex btn-primary bg-white text-primary-700 hover:bg-primary-50">
            Find a Therapist Now
          </Link>
        </div>
      </section>
    </Layout>
  );
}
