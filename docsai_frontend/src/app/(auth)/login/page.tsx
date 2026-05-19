"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CloudFog, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { login } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.email || !form.password) return;
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      console.log("Data - > " , data)
      
      setAuth({ username: form.email.split("@")[0], email: form.email });
      toast({ title: "Welcome back!" });
      router.push("/chat");
    } catch (err: unknown) {
      const e = err as { detail?: string };
      console.log("Error object at the login file : " , e)
      toast({
        title: "Login failed",
        description: e?.detail ?? "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7f4ef] to-[#ede9e0] px-4">
      <div className="bg-white border border-black/10 rounded-2xl p-10 w-full max-w-md shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl text-[#0f0e0c] mb-1">Welcome back</h1>
          <p className="text-sm text-[#5a5852]">Sign in to your DocsAI account</p>
        </div>

        <div className="space-y-4">
          {[
            { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
            { key: "password", label: "Password", type: "password", placeholder: "Your password" },
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
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-[#2d5a3d] text-white text-sm font-medium hover:bg-[#4a8a5f] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        <p className="text-center text-sm text-[#5a5852] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#2d5a3d] font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
