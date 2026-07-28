import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";

export function PrivacyPage() {
  return (
    <Layout>
      <SEO title="Privacy Policy" />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 prose prose-slate">
          <h1 className="section-title">Privacy Policy</h1>
          <p className="mt-6 text-slate-600 leading-relaxed">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <div className="mt-8 space-y-6 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Information We Collect</h2>
              <p className="mt-2">
                We collect information you provide when creating an account, booking appointments,
                leaving reviews, or contacting us. This may include your name, email, phone number,
                and appointment preferences.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-slate-900">How We Use Your Information</h2>
              <p className="mt-2">
                We use your information to facilitate therapist-client connections, process booking requests,
                send notifications, and improve our services. We do not sell your personal information to third parties.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Data Security</h2>
              <p className="mt-2">
                We implement industry-standard security measures to protect your data, including encrypted
                passwords and secure authentication tokens.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
              <p className="mt-2">
                For privacy-related inquiries, contact us at privacy@therapyconnect.com.
              </p>
            </section>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export function TermsPage() {
  return (
    <Layout>
      <SEO title="Terms of Service" />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="section-title">Terms of Service</h1>
          <p className="mt-6 text-slate-600 leading-relaxed">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <div className="mt-8 space-y-6 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Acceptance of Terms</h2>
              <p className="mt-2">
                By accessing TherapyConnect, you agree to these terms. If you do not agree, please do not use our platform.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Platform Role</h2>
              <p className="mt-2">
                TherapyConnect is a directory platform that connects clients with therapists. We do not provide
                therapy services directly and are not responsible for the quality of care provided by listed therapists.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-slate-900">User Accounts</h2>
              <p className="mt-2">
                You are responsible for maintaining the confidentiality of your account credentials and for all
                activities under your account.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Reviews</h2>
              <p className="mt-2">
                Reviews must be honest and based on genuine experiences. We reserve the right to remove reviews
                that violate our guidelines.
              </p>
            </section>
          </div>
        </div>
      </section>
    </Layout>
  );
}
