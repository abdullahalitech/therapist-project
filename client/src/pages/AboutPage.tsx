import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { Heart, Users, Target, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <Layout>
      <SEO title="About Us" description="Learn about TherapyConnect and our mission to make mental health care accessible." />

      <section className="bg-gradient-to-br from-primary-50 to-white py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="section-title">About TherapyConnect</h1>
          <p className="section-subtitle">
            We're on a mission to make finding the right therapist simple, transparent, and accessible for everyone.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Our Story</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                TherapyConnect was founded with a simple belief: everyone deserves access to quality mental health care.
                We noticed how difficult it was for people to find therapists who matched their needs, location, and preferences.
              </p>
              <p className="mt-4 leading-relaxed text-slate-600">
                Our platform bridges that gap by providing a comprehensive directory of verified therapists,
                complete with reviews, detailed profiles, and an easy booking system.
              </p>
            </div>
            <div className="card bg-primary-50">
              <Heart className="h-12 w-12 text-primary-600" />
              <h3 className="mt-4 text-xl font-semibold">Our Mission</h3>
              <p className="mt-2 text-slate-600">
                To connect individuals with qualified mental health professionals, reducing barriers to care
                and promoting mental wellness in communities everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold">Our Values</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: Users, title: "Accessibility", desc: "Mental health care should be within reach for everyone, regardless of background." },
              { icon: Target, title: "Transparency", desc: "Honest reviews and detailed profiles help you make informed decisions." },
              { icon: Award, title: "Quality", desc: "Every therapist is verified and approved before joining our directory." },
            ].map((v) => (
              <div key={v.title} className="card text-center">
                <v.icon className="mx-auto h-10 w-10 text-primary-600" />
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
