import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Navigation } from "lucide-react";
import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { TherapistCard } from "../components/TherapistCard";
import { api } from "../lib/api";

export default function DirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [specialty, setSpecialty] = useState(searchParams.get("specialty") || "");
  const [sessionType, setSessionType] = useState(searchParams.get("sessionType") || "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");
  const [lat, setLat] = useState<number | undefined>(
    searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined
  );
  const [lng, setLng] = useState<number | undefined>(
    searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined
  );
  const [radiusKm, setRadiusKm] = useState(searchParams.get("radiusKm") || "50");
  const page = parseInt(searchParams.get("page") || "1");

  const { data: specialties = [] } = useQuery({
    queryKey: ["specialties"],
    queryFn: api.getSpecialties,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["therapists", q, city, state, specialty, sessionType, minRating, lat, lng, radiusKm, page],
    queryFn: () =>
      api.getTherapists({
        q: q || undefined,
        city: city || undefined,
        state: state || undefined,
        specialty: specialty || undefined,
        sessionType: sessionType || undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        lat,
        lng,
        radiusKm: lat && lng ? parseFloat(radiusKm) : undefined,
        page,
        limit: 12,
      }),
  });

  const applyFilters = () => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (city) params.city = city;
    if (state) params.state = state;
    if (specialty) params.specialty = specialty;
    if (sessionType) params.sessionType = sessionType;
    if (minRating) params.minRating = minRating;
    if (lat !== undefined) params.lat = String(lat);
    if (lng !== undefined) params.lng = String(lng);
    if (radiusKm) params.radiusKm = radiusKm;
    params.page = "1";
    setSearchParams(params);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    });
  };

  useEffect(() => {
    if (lat !== undefined && lng !== undefined) applyFilters();
  }, [lat, lng]);

  return (
    <Layout>
      <SEO title="Find a Therapist" description="Browse and filter therapists by location, specialty, and more." />

      <section className="bg-gradient-to-br from-primary-50 to-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="section-title">Find a Therapist</h1>
          <p className="section-subtitle">Search our directory of verified mental health professionals</p>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="card mb-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label className="mb-1 block text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Name, specialty, keyword..."
                    className="input-field pl-10"
                    onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">City</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. New York"
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">State</label>
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. NY"
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Specialty</label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="input-field"
                >
                  <option value="">All specialties</option>
                  {specialties.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Session Type</label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="input-field"
                >
                  <option value="">Any</option>
                  <option value="in-person">In-person</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Min Rating</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="input-field"
                >
                  <option value="">Any</option>
                  <option value="4">4+ stars</option>
                  <option value="3">3+ stars</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Radius (km)</label>
                <input
                  type="number"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(e.target.value)}
                  className="input-field"
                  min={1}
                  max={500}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={applyFilters} className="btn-primary gap-2">
                <Search className="h-4 w-4" />
                Search
              </button>
              <button onClick={useMyLocation} className="btn-secondary gap-2">
                <Navigation className="h-4 w-4" />
                Use My Location
              </button>
              {(lat !== undefined && lng !== undefined) && (
                <span className="flex items-center gap-1 text-sm text-primary-700">
                  <MapPin className="h-4 w-4" />
                  Location filter active
                </span>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : !data?.data.length ? (
            <div className="py-16 text-center">
              <p className="text-lg text-slate-600">No therapists found matching your criteria.</p>
              <p className="mt-2 text-sm text-slate-500">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-slate-600">
                Showing {data.data.length} of {data.total} therapists
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.data.map((t) => (
                  <TherapistCard key={t.id} therapist={t} />
                ))}
              </div>
              {data.totalPages > 1 && (
                <div className="mt-10 flex justify-center gap-2">
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        const params = Object.fromEntries(searchParams);
                        params.page = String(p);
                        setSearchParams(params);
                      }}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${
                        p === page
                          ? "bg-primary-600 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
