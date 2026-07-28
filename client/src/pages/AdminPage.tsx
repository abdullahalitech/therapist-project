import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { api } from "../lib/api";
import { CheckCircle, XCircle, Eye, EyeOff, Trash2 } from "lucide-react";

function AdminPanel() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pending" | "reviews" | "faqs" | "contacts">("pending");
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const { data: pending = [] } = useQuery({
    queryKey: ["admin-pending"],
    queryFn: api.adminGetPendingTherapists,
    enabled: tab === "pending",
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: api.adminGetReviews,
    enabled: tab === "reviews",
  });

  const { data: faqs = [] } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: api.adminGetFaqs,
    enabled: tab === "faqs",
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: api.adminGetContactMessages,
    enabled: tab === "contacts",
  });

  const approve = async (id: string) => {
    setActionError("");
    setActionSuccess("");
    setActionLoading(id);
    try {
      await api.adminApproveTherapist(id);
      setActionSuccess("Therapist approved successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to approve therapist");
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id: string) => {
    setActionError("");
    setActionSuccess("");
    setActionLoading(id);
    try {
      await api.adminRejectTherapist(id);
      setActionSuccess("Therapist rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reject therapist");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleReview = async (id: string, action: "hide" | "publish") => {
    if (action === "hide") await api.adminHideReview(id);
    else await api.adminPublishReview(id);
    queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  const createFaq = async () => {
    if (!newFaq.question || !newFaq.answer) return;
    await api.adminCreateFaq(newFaq);
    setNewFaq({ question: "", answer: "" });
    queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
  };

  const deleteFaq = async (id: string) => {
    await api.adminDeleteFaq(id);
    queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
  };

  const markRead = async (id: string) => {
    await api.adminMarkContactRead(id);
    queryClient.invalidateQueries({ queryKey: ["admin-contacts"] });
  };

  const tabs = [
    { id: "pending" as const, label: "Pending Therapists" },
    { id: "reviews" as const, label: "Reviews" },
    { id: "faqs" as const, label: "FAQs" },
    { id: "contacts" as const, label: "Contact Messages" },
  ];

  return (
    <Layout>
      <SEO title="Admin Panel" />

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>

          {actionError && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</div>
          )}
          {actionSuccess && (
            <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{actionSuccess}</div>
          )}

          <div className="mt-6 flex flex-wrap gap-2 border-b">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  tab === t.id
                    ? "border-primary-600 text-primary-700"
                    : "border-transparent text-slate-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {tab === "pending" && (
              <div className="space-y-4">
                {pending.length === 0 ? (
                  <p className="text-slate-600">No pending therapist applications.</p>
                ) : (
                  pending.map((t) => (
                    <div key={t.id} className="card">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">{t.firstName} {t.lastName}</h3>
                          <p className="text-sm text-slate-600">{t.headline}</p>
                          <p className="mt-1 text-sm">{t.location.city}, {t.location.state}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {t.specialties.map((s) => (
                              <span key={s} className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approve(t.id)}
                            disabled={actionLoading === t.id}
                            className="btn-primary gap-1 py-2 text-sm disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            {actionLoading === t.id ? "Approving..." : "Approve"}
                          </button>
                          <button
                            onClick={() => reject(t.id)}
                            disabled={actionLoading === t.id}
                            className="btn-secondary gap-1 py-2 text-sm text-red-600 disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                            {actionLoading === t.id ? "Processing..." : "Reject"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "reviews" && (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="card">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{r.title} — {r.rating}/5</p>
                        <p className="text-sm text-slate-600">{r.body}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {r.clientName} on {r.therapistName} · {r.status}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleReview(r.id, r.status === "published" ? "hide" : "publish")}
                        className="btn-secondary gap-1 py-1 text-xs"
                      >
                        {r.status === "published" ? (
                          <><EyeOff className="h-3.5 w-3.5" /> Hide</>
                        ) : (
                          <><Eye className="h-3.5 w-3.5" /> Publish</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "faqs" && (
              <div>
                <div className="card mb-6 space-y-3">
                  <h3 className="font-semibold">Add FAQ</h3>
                  <input
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    placeholder="Question"
                    className="input-field"
                  />
                  <textarea
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                    placeholder="Answer"
                    rows={3}
                    className="input-field"
                  />
                  <button onClick={createFaq} className="btn-primary">Add FAQ</button>
                </div>
                <div className="space-y-3">
                  {faqs.map((f) => (
                    <div key={f._id} className="card flex justify-between">
                      <div>
                        <p className="font-medium">{f.question}</p>
                        <p className="text-sm text-slate-600">{f.answer}</p>
                      </div>
                      <button onClick={() => deleteFaq(f._id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "contacts" && (
              <div className="space-y-4">
                {contacts.map((c) => (
                  <div key={c._id} className={`card ${c.isRead ? "opacity-60" : ""}`}>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{c.subject}</p>
                        <p className="text-sm text-slate-500">{c.name} · {c.email}</p>
                        <p className="mt-2 text-sm">{c.message}</p>
                      </div>
                      {!c.isRead && (
                        <button onClick={() => markRead(c._id)} className="btn-secondary py-1 text-xs">
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <AdminPanel />
    </ProtectedRoute>
  );
}
