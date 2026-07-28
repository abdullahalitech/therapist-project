import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerClientSchema } from "@therapist/shared";
import { z } from "zod";
import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { useAuth } from "../context/AuthContext";

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerClientSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/dashboard";
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError("");
    try {
      await login(data.email, data.password);
      navigate(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <Layout>
      <SEO title="Log In" />
      <section className="py-16">
        <div className="mx-auto max-w-md px-4">
          <div className="card">
            <h1 className="text-2xl font-bold text-center">Welcome Back</h1>
            <p className="mt-2 text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary-700 font-medium hover:underline">Sign up</Link>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input {...register("email")} type="email" className="input-field" />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Password</label>
                <input {...register("password")} type="password" className="input-field" />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? "Logging in..." : "Log In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Are you a therapist?{" "}
              <Link to="/register/therapist" className="text-primary-700 font-medium hover:underline">
                Join our directory
              </Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerClientSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setError("");
    try {
      await registerUser(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <Layout>
      <SEO title="Sign Up" />
      <section className="py-16">
        <div className="mx-auto max-w-md px-4">
          <div className="card">
            <h1 className="text-2xl font-bold text-center">Create Account</h1>
            <p className="mt-2 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="text-primary-700 font-medium hover:underline">Log in</Link>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input {...register("email")} type="email" className="input-field" />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone (optional)</label>
                <input {...register("phone")} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Password</label>
                <input {...register("password")} type="password" className="input-field" />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
