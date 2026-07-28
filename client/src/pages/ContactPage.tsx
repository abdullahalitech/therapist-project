import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema } from "@therapist/shared";
import { z } from "zod";
import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { api } from "../lib/api";
import { Mail, Phone, MapPin, CheckCircle } from "lucide-react";

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (data: ContactForm) => {
    setError("");
    try {
      await api.submitContact(data);
      setSubmitted(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  return (
    <Layout>
      <SEO title="Contact Us" description="Get in touch with the TherapyConnect team." />

      <section className="bg-gradient-to-br from-primary-50 to-white py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="section-title">Contact Us</h1>
          <p className="section-subtitle">Have a question? We'd love to hear from you.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-xl font-semibold">Get in Touch</h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="h-5 w-5 text-primary-600" />
                support@therapyconnect.com
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="h-5 w-5 text-primary-600" />
                (555) 123-4567
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="h-5 w-5 text-primary-600" />
                123 Wellness Ave, New York, NY 10001
              </div>
            </div>
          </div>

          <div className="card">
            {submitted ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-lg font-semibold">Message Sent!</h3>
                <p className="mt-2 text-slate-600">We'll get back to you within 24-48 hours.</p>
                <button onClick={() => setSubmitted(false)} className="btn-primary mt-6">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium">Name</label>
                  <input {...register("name")} className="input-field" />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input {...register("email")} type="email" className="input-field" />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Subject</label>
                  <input {...register("subject")} className="input-field" />
                  {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Message</label>
                  <textarea {...register("message")} rows={5} className="input-field" />
                  {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
