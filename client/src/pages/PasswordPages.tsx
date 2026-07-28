import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, resetPasswordSchema } from "@therapist/shared";
import { z } from "zod";
import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { api } from "../lib/api";

type ForgotForm = z.infer<typeof forgotPasswordSchema>;
type ResetForm = z.infer<typeof resetPasswordSchema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    await api.forgotPassword(data.email);
    setSent(true);
  };

  return (
    <Layout>
      <SEO title="Forgot Password" />
      <section className="py-16">
        <div className="mx-auto max-w-md px-4">
          <div className="card">
            <h1 className="text-2xl font-bold text-center">Forgot Password</h1>
            {sent ? (
              <p className="mt-4 text-center text-slate-600">
                If that email exists, a reset link has been sent. Check your inbox.
              </p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input {...register("email")} type="email" className="input-field" />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                  Send Reset Link
                </button>
              </form>
            )}
            <p className="mt-4 text-center text-sm">
              <Link to="/login" className="text-primary-700 hover:underline">Back to login</Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetForm) => {
    await api.resetPassword(data.token, data.password);
    setDone(true);
  };

  return (
    <Layout>
      <SEO title="Reset Password" />
      <section className="py-16">
        <div className="mx-auto max-w-md px-4">
          <div className="card">
            <h1 className="text-2xl font-bold text-center">Reset Password</h1>
            {done ? (
              <div className="mt-4 text-center">
                <p className="text-slate-600">Password reset successful!</p>
                <Link to="/login" className="btn-primary mt-4 inline-flex">Log In</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
                <input type="hidden" {...register("token")} />
                <div>
                  <label className="mb-1 block text-sm font-medium">New Password</label>
                  <input {...register("password")} type="password" className="input-field" />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                  Reset Password
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
