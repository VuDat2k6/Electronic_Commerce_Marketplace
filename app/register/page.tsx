// RegisterPage - Modern design with gradient theme
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";

const RegisterPage = () => {
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    email: "",
    password: "",
    confirmpassword: "",
    terms: false,
  });
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.replace("/");
    }
  }, [sessionStatus, router]);

  const validateField = (name: string, value: string | boolean): string | null => {
    switch (name) {
      case "name":
        if (!String(value).trim()) return "First name is required";
        if (String(value).trim().length < 2) return "First name must be at least 2 characters";
        return null;
      case "lastname":
        if (!String(value).trim()) return "Last name is required";
        if (String(value).trim().length < 2) return "Last name must be at least 2 characters";
        return null;
      case "email":
        if (!String(value).trim()) return "Email is required";
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (!emailRegex.test(String(value))) return "Please enter a valid email";
        return null;
      case "password":
        if (!value) return "Password is required";
        if (String(value).length < 8) return "Password must be at least 8 characters";
        return null;
      case "confirmpassword":
        if (value !== formData.password) return "Passwords do not match";
        return null;
      case "terms":
        if (!value) return "You must accept the terms";
        return null;
      default:
        return null;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    const fieldError = validateField(name, fieldValue);
    if (fieldError) {
      setFieldErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  };

  const getPasswordStrength = (password: string): { level: number; label: string; color: string } => {
    if (password.length === 0) return { level: 0, label: "", color: "" };
    if (password.length < 8) return { level: 1, label: "Too short", color: "bg-red-500" };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    if (strength <= 2) return { level: 2, label: "Weak", color: "bg-red-500" };
    if (strength <= 3) return { level: 3, label: "Fair", color: "bg-yellow-500" };
    if (strength <= 4) return { level: 4, label: "Good", color: "bg-green-500" };
    return { level: 5, label: "Strong", color: "bg-green-600" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    Object.entries(formData).forEach(([name, value]) => {
      const error = validateField(name, value);
      if (error) errors[name] = error;
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors below");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Registration successful! Please log in.");
        setTimeout(() => router.push("/login"), 1000);
      } else {
        if (data.details && Array.isArray(data.details)) {
          const errorMessage = data.details.map((err: { message: string }) => err.message).join(", ");
          setError(errorMessage);
          toast.error(errorMessage);
        } else if (data.error) {
          setError(data.error);
          toast.error(data.error);
        } else {
          setError("Registration failed. Please try again.");
          toast.error("Registration failed");
        }
      }
    } catch {
      toast.error("An unexpected error occurred.");
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-white/80">Join us to start shopping</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`block w-full rounded-xl border px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                    fieldErrors.name ? "border-red-300 focus:border-red-500 focus:ring-red-500/30" : "border-gray-200 focus:border-purple-500 focus:ring-purple-500/30"
                  } disabled:bg-gray-50`}
                  placeholder="John"
                />
                {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                <input
                  id="lastname"
                  name="lastname"
                  type="text"
                  value={formData.lastname}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`block w-full rounded-xl border px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                    fieldErrors.lastname ? "border-red-300 focus:border-red-500 focus:ring-red-500/30" : "border-gray-200 focus:border-purple-500 focus:ring-purple-500/30"
                  } disabled:bg-gray-50`}
                  placeholder="Doe"
                />
                {fieldErrors.lastname && <p className="mt-1 text-sm text-red-600">{fieldErrors.lastname}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`block w-full rounded-xl border px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                  fieldErrors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500/30" : "border-gray-200 focus:border-purple-500 focus:ring-purple-500/30"
                } disabled:bg-gray-50`}
                placeholder="you@example.com"
              />
              {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`block w-full rounded-xl border px-4 py-3 pr-12 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                    fieldErrors.password ? "border-red-300 focus:border-red-500 focus:ring-red-500/30" : "border-gray-200 focus:border-purple-500 focus:ring-purple-500/30"
                  } disabled:bg-gray-50`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength.level ? passwordStrength.color : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{passwordStrength.label}</p>
                </div>
              )}
              {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmpassword" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmpassword"
                  name="confirmpassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmpassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`block w-full rounded-xl border px-4 py-3 pr-12 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                    fieldErrors.confirmpassword ? "border-red-300 focus:border-red-500 focus:ring-red-500/30" : "border-gray-200 focus:border-purple-500 focus:ring-purple-500/30"
                  } disabled:bg-gray-50`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmpassword && !fieldErrors.confirmpassword && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Passwords match
                </p>
              )}
              {fieldErrors.confirmpassword && <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmpassword}</p>}
            </div>

            <div className="flex items-start gap-3">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={formData.terms}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the <a href="#" className="text-purple-600 hover:underline">Terms</a> and <a href="#" className="text-purple-600 hover:underline">Privacy Policy</a>
              </label>
            </div>
            {fieldErrors.terms && <p className="text-sm text-red-600 -mt-3">{fieldErrors.terms}</p>}

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-3.5 text-sm font-semibold text-white hover:from-purple-700 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-purple-600 hover:text-purple-700">Sign in</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
