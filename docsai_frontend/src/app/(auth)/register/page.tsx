"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { register } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.username.length < 3) e.username = "Minimum 3 characters";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await register(form.username, form.email, form.password);
      setAuth(data.token, { username: form.username, email: form.email });
      toast({ title: "Welcome to DocsAI!", description: data.message });
      router.push("/chat");
    } catch (err: unknown) {
      const e = err as { detail?: string | Array<{ loc: string[]; msg: string }> };
      if (typeof e?.detail === "string") {
        toast({ title: "Error", description: e.detail, variant: "destructive" });
      } else if (Array.isArray(e?.detail)) {
        const fieldErrors: Record<string, string> = {};
        e.detail.forEach((d) => {
          const field = d.loc[d.loc.length - 1];
          fieldErrors[field] = d.msg;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7f4ef] to-[#ede9e0] px-4">
      <div className="bg-white border border-black/10 rounded-2xl p-10 w-full max-w-md shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl text-[#0f0e0c] mb-1">Create your account</h1>
          <p className="text-sm text-[#5a5852]">Start chatting with your documents</p>
        </div>

        <div className="space-y-4">
          {[
            { key: "username", label: "Username", type: "text", placeholder: "yousaf" },
            { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
            { key: "password", label: "Password", type: "password", placeholder: "Min. 6 characters" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-[#0f0e0c] mb-1.5">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/30 focus:border-[#2d5a3d] transition-all"
              />
              {errors[key] && (
                <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
              )}
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-[#2d5a3d] text-white text-sm font-medium hover:bg-[#4a8a5f] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </div>

        <p className="text-center text-sm text-[#5a5852] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#2d5a3d] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
