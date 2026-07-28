import type { UserPublic, PaginatedResponse } from "@therapist/shared";

const API_BASE = "/api/v1";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
  }
}

let accessToken: string | null = localStorage.getItem("accessToken");

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
}

export function getAccessToken() {
  return accessToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && accessToken && !path.includes("/auth/refresh")) {
    const refreshed = await refreshToken();
    if (refreshed) {
      return request(path, options);
    }
  }

  if (!res.ok) {
    throw new ApiError(data.error || "Request failed", res.status, data.details);
  }

  return data as T;
}

async function refreshToken(): Promise<boolean> {
  try {
    const data = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    }).then((r) => r.json());

    if (data.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
  } catch {
    setAccessToken(null);
  }
  return false;
}

export const api = {
  register: (body: unknown) =>
    request<{ user: UserPublic; accessToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  registerTherapist: (body: unknown) =>
    request<{ user: UserPublic; accessToken: string; message: string }>(
      "/auth/register/therapist",
      { method: "POST", body: JSON.stringify(body) }
    ),

  login: (body: unknown) =>
    request<{ user: UserPublic; accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  logout: () =>
    request<{ message: string }>("/auth/logout", { method: "POST" }),

  me: () => request<{ user: UserPublic }>("/auth/me"),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  getTherapists: (params: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v));
    });
    return request<PaginatedResponse<import("@therapist/shared").TherapistProfilePublic>>(
      `/therapists?${query}`
    );
  },

  getFeaturedTherapists: () =>
    request<import("@therapist/shared").TherapistProfilePublic[]>("/therapists/featured"),

  getSpecialties: () => request<string[]>("/therapists/specialties/list"),

  getTherapist: (slug: string) =>
    request<import("@therapist/shared").TherapistProfilePublic>(`/therapists/${slug}`),

  getTherapistReviews: (slug: string, page = 1) =>
    request<PaginatedResponse<import("@therapist/shared").ReviewPublic>>(
      `/therapists/${slug}/reviews?page=${page}`
    ),

  getTherapistAvailability: (slug: string, date: string) =>
    request<{ date: string; bookedSlots: string[] }>(
      `/therapists/${slug}/availability?date=${date}`
    ),

  getFaqs: () => request<import("@therapist/shared").FAQPublic[]>("/faqs"),

  submitContact: (body: unknown) =>
    request<{ message: string }>("/contact", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createBooking: (body: unknown) =>
    request<{ id: string; message: string }>("/bookings", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getMyBookings: () =>
    request<import("@therapist/shared").BookingPublic[]>("/bookings/me"),

  getPendingReviews: () =>
    request<import("@therapist/shared").BookingPublic[]>("/bookings/me/pending-reviews"),

  getTherapistBookings: () =>
    request<
      Array<{
        id: string;
        clientId: string;
        clientName: string;
        clientEmail: string;
        preferredDate: string;
        preferredTime: string;
        message?: string;
        status: string;
        createdAt: string;
      }>
    >("/bookings/therapist/inbox"),

  updateBooking: (id: string, body: unknown) =>
    request<{ message: string; status: string }>(`/bookings/therapist/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  createReview: (body: unknown) =>
    request<{ id: string; message: string }>("/reviews", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getTherapistProfile: () =>
    request<import("@therapist/shared").TherapistProfilePublic>("/therapist/profile"),

  updateTherapistProfile: (body: unknown) =>
    request<import("@therapist/shared").TherapistProfilePublic>("/therapist/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  uploadProfileImage: (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return request<{ profileImageUrl: string }>("/therapist/profile/image", {
      method: "POST",
      body: form,
    });
  },

  getTherapistStatus: () => request<{ status: string }>("/therapist/status"),

  adminGetPendingTherapists: () =>
    request<import("@therapist/shared").TherapistProfilePublic[]>("/admin/therapists/pending"),

  adminApproveTherapist: (id: string) =>
    request<{ message: string }>(`/admin/therapists/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({}),
    }),

  adminRejectTherapist: (id: string) =>
    request<{ message: string }>(`/admin/therapists/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({}),
    }),

  adminGetReviews: () =>
    request<
      Array<{
        id: string;
        rating: number;
        title: string;
        body: string;
        status: string;
        clientName: string;
        therapistName: string;
        createdAt: string;
      }>
    >("/admin/reviews"),

  adminHideReview: (id: string) =>
    request<{ message: string }>(`/admin/reviews/${id}/hide`, { method: "PATCH" }),

  adminPublishReview: (id: string) =>
    request<{ message: string }>(`/admin/reviews/${id}/publish`, { method: "PATCH" }),

  adminGetFaqs: () => request<Array<{ _id: string; question: string; answer: string; order: number; isPublished: boolean }>>("/admin/faqs"),

  adminCreateFaq: (body: unknown) =>
    request<unknown>("/admin/faqs", { method: "POST", body: JSON.stringify(body) }),

  adminUpdateFaq: (id: string, body: unknown) =>
    request<unknown>(`/admin/faqs/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  adminDeleteFaq: (id: string) =>
    request<{ message: string }>(`/admin/faqs/${id}`, { method: "DELETE" }),

  adminGetContactMessages: () =>
    request<
      Array<{
        _id: string;
        name: string;
        email: string;
        subject: string;
        message: string;
        isRead: boolean;
        createdAt: string;
      }>
    >("/admin/contact-messages"),

  adminMarkContactRead: (id: string) =>
    request<{ message: string }>(`/admin/contact-messages/${id}/read`, { method: "PATCH" }),

  getConversations: () =>
    request<import("@therapist/shared").ConversationPublic[]>("/conversations"),

  getEligibleContacts: () =>
    request<
      Array<{ therapistId: string; name: string } | { clientId: string; name: string }>
    >("/conversations/eligible"),

  createConversation: (body: { therapistId?: string; clientId?: string }) =>
    request<import("@therapist/shared").ConversationPublic>("/conversations", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getMessages: (conversationId: string, before?: string) => {
    const params = new URLSearchParams();
    if (before) params.set("before", before);
    const query = params.toString();
    return request<import("@therapist/shared").MessagePublic[]>(
      `/conversations/${conversationId}/messages${query ? `?${query}` : ""}`
    );
  },

  sendMessage: (conversationId: string, body: string) =>
    request<import("@therapist/shared").MessagePublic>(
      `/conversations/${conversationId}/messages`,
      { method: "POST", body: JSON.stringify({ body }) }
    ),

  markConversationRead: (conversationId: string) =>
    request<{ message: string; count: number }>(`/conversations/${conversationId}/read`, {
      method: "PATCH",
    }),
};

export { ApiError };
