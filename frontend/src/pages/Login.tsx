import { useState } from "react";
import { api } from "../api/api";

type Props = {
  onLogin: (user: any) => void;
};

type Mode = "login" | "register";

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {open ? (
      <>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.5 21.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.5 21.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <path d="M1 1l22 22" />
      </>
    )}
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
  </svg>
);

export default function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isLogin = mode === "login";

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setShowPassword(false);
  };

  const validate = (): string | null => {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (!isLogin) {
      if (!username.trim()) return "Username is required.";
      if (password !== confirmPassword) return "Passwords do not match.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email, password }
        : { username, email, password };

      const res = await api.post(endpoint, payload);

      localStorage.setItem("token", res.data.token);
      onLogin(res.data.user);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (isLogin ? "Invalid email or password." : "Could not create account.");
      setError(message);
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAF8] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-[#4338CA] flex items-center justify-center shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 11.5a8.5 8.5 0 0 1-12.36 7.58L3 20l1.07-5.4A8.5 8.5 0 1 1 21 11.5Z"
                fill="white"
                opacity="0.95"
              />
            </svg>
          </div>
          <span className="text-[#1A1A1A] font-semibold text-lg tracking-tight">ChatLine</span>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#F0F0EE] overflow-hidden">
          <div className="relative px-6 pt-6">
            <div className="relative flex bg-[#F4F4F2] rounded-full p-1">
              <div
                className="absolute top-1 bottom-1 w-1/2 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out"
                style={{ transform: isLogin ? "translateX(0%)" : "translateX(100%)" }}
              />
              <div
                className="absolute -bottom-[5px] h-2.5 w-2.5 bg-white rotate-45 transition-all duration-300 ease-out"
                style={{
                  left: isLogin ? "calc(25% - 5px)" : "calc(75% - 5px)",
                  boxShadow: "2px 2px 2px rgba(0,0,0,0.03)",
                }}
              />
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`relative z-10 flex-1 text-sm font-medium py-2.5 rounded-full transition-colors ${
                  isLogin ? "text-[#1A1A1A]" : "text-[#8A8A8E] hover:text-[#4A4A4E]"
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`relative z-10 flex-1 text-sm font-medium py-2.5 rounded-full transition-colors ${
                  !isLogin ? "text-[#1A1A1A]" : "text-[#8A8A8E] hover:text-[#4A4A4E]"
                }`}
              >
                Sign up
              </button>
            </div>
          </div>

          <div className="px-7 pt-7 pb-1">
            <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-[#8A8A8E] mt-1">
              {isLogin
                ? "Log in to pick up your conversations."
                : "Takes less than a minute to get started."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-7 pb-7 pt-5 space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="username" className="block text-xs font-medium text-[#4A4A4E] mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="w-full rounded-xl border border-[#E5E5E3] bg-[#FAFAF8] px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#B5B5B2] outline-none transition focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/10"
                  autoComplete="username"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#4A4A4E] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#E5E5E3] bg-[#FAFAF8] px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#B5B5B2] outline-none transition focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/10"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#4A4A4E] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#E5E5E3] bg-[#FAFAF8] px-3.5 py-2.5 pr-10 text-sm text-[#1A1A1A] placeholder-[#B5B5B2] outline-none transition focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/10"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B5B5B2] hover:text-[#4A4A4E] transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-[#4A4A4E] mb-1.5">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#E5E5E3] bg-[#FAFAF8] px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#B5B5B2] outline-none transition focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/10"
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <div className="text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4338CA] text-white text-sm font-semibold py-2.5 hover:bg-[#372DB0] active:bg-[#2F27A0] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading && <Spinner />}
              {isLogin ? "Log in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#B5B5B2] mt-6">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(isLogin ? "register" : "login")}
            className="text-[#4338CA] font-medium hover:text-[#372DB0] transition"
          >
            {isLogin ? "Create an account" : "Log in instead"}
          </button>
        </p>
      </div>
    </div>
  );
}