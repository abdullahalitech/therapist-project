import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerTherapistSchema } from "@therapist/shared";
import { z } from "zod";
import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { useAuth } from "../context/AuthContext";

type TherapistForm = z.infer<typeof registerTherapistSchema>;

const SPECIALTY_OPTIONS = [
  "Anxiety", "Depression", "CBT", "Couples Therapy", "Family Therapy",
  "Trauma", "PTSD", "Addiction", "Child Therapy", "Grief Counseling",
  "ADHD", "Communication", "Life Transitions",
];

const LANGUAGE_OPTIONS = ["English", "Spanish", "Mandarin", "Hindi", "French", "Arabic"];

export default function TherapistRegisterPage() {
  const { registerTherapist } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
  const [sessionTypes, setSessionTypes] = useState<string[]>(["in-person"]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TherapistForm>({
    resolver: zodResolver(registerTherapistSchema),
    defaultValues: { country: "USA", languages: ["English"], sessionTypes: ["in-person"], specialties: [] },
  });

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string, field: "specialties" | "languages" | "sessionTypes") => {
    const updated = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
    setList(updated);
    setValue(field, updated as never);
  };

  const onSubmit = async (data: TherapistForm) => {
    setError("");
    try {
      await registerTherapist({
        ...data,
        specialties: selectedSpecialties,
        languages: selectedLanguages,
        sessionTypes: sessionTypes,
      });
      navigate("/therapist/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <Layout>
      <SEO title="Join as Therapist" description="Register as a therapist on TherapyConnect." />

      <section className="py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="card">
            <h1 className="text-2xl font-bold">Join as a Therapist</h1>
            <p className="mt-2 text-slate-600">
              Create your profile to be listed in our directory. Your profile will be reviewed before going live.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <fieldset>
                <legend className="font-semibold">Account</legend>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">First Name</label>
                    <input {...register("firstName")} className="input-field" />
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Last Name</label>
                    <input {...register("lastName")} className="input-field" />
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Email</label>
                    <input {...register("email")} type="email" className="input-field" />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Password</label>
                    <input {...register("password")} type="password" className="input-field" />
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend className="font-semibold">Professional Profile</legend>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Headline</label>
                    <input {...register("headline")} placeholder="e.g. Licensed Clinical Psychologist" className="input-field" />
                    {errors.headline && <p className="mt-1 text-sm text-red-600">{errors.headline.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Bio</label>
                    <textarea {...register("bio")} rows={4} className="input-field" placeholder="Tell clients about your approach and experience..." />
                    {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Specialties</label>
                    <div className="flex flex-wrap gap-2">
                      {SPECIALTY_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleItem(selectedSpecialties, setSelectedSpecialties, s, "specialties")}
                          className={`rounded-full px-3 py-1 text-sm ${
                            selectedSpecialties.includes(s)
                              ? "bg-primary-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {errors.specialties && <p className="mt-1 text-sm text-red-600">{errors.specialties.message}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Languages</label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGE_OPTIONS.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => toggleItem(selectedLanguages, setSelectedLanguages, l, "languages")}
                          className={`rounded-full px-3 py-1 text-sm ${
                            selectedLanguages.includes(l)
                              ? "bg-primary-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Session Types</label>
                    <div className="flex gap-2">
                      {["in-person", "online"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleItem(sessionTypes, setSessionTypes, t, "sessionTypes")}
                          className={`rounded-full px-3 py-1 text-sm capitalize ${
                            sessionTypes.includes(t)
                              ? "bg-primary-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend className="font-semibold">Location</legend>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">City</label>
                    <input {...register("city")} className="input-field" />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">State</label>
                    <input {...register("state")} className="input-field" />
                    {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">ZIP Code</label>
                    <input {...register("zip")} className="input-field" />
                    {errors.zip && <p className="mt-1 text-sm text-red-600">{errors.zip.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Years of Experience</label>
                    <input {...register("yearsExperience", { valueAsNumber: true })} type="number" min={0} className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Hourly Rate ($)</label>
                    <input {...register("hourlyRate", { valueAsNumber: true })} type="number" min={0} className="input-field" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Office Address (optional)</label>
                    <input {...register("address")} className="input-field" />
                  </div>
                </div>
              </fieldset>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already registered? <Link to="/login" className="text-primary-700 hover:underline">Log in</Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
