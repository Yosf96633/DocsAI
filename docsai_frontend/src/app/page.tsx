import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import FooterSection from "@/components/landing/FooterSection";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />

        {/* Stats */}
        <section className="py-20 px-12 bg-[#f7f4ef] text-center">
          <p className="text-xs font-medium tracking-widest uppercase text-[#2d5a3d] mb-10">
            Trusted by legal teams
          </p>
          <div className="flex justify-center gap-16 max-w-2xl mx-auto">
            {[
              { num: "10x", label: "Faster document review" },
              { num: "100%", label: "Citation accuracy" },
              { num: "< 30s", label: "From upload to insight" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-serif text-[2.5rem] text-[#0f0e0c] leading-none">
                  {s.num}
                </div>
                <div className="text-sm text-[#5a5852] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <FeaturesSection />

        {/* CTA */}
        <section className="py-24 px-12 bg-[#2d5a3d] text-center relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 200% at -20% 50%, rgba(255,255,255,0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 150% at 110% 50%, rgba(0,0,0,0.06) 0%, transparent 60%)",
            }}
          />
          <h2 className="font-serif text-[2.8rem] text-white mb-4 relative z-10">
            Stop reading,
            <br />
            <em className="opacity-80">start asking.</em>
          </h2>
          <p className="text-white/60 text-base font-light mb-8 relative z-10">
            Join legal teams already using DocsAI to work smarter.
          </p>
          <a
            href="/register"
            className="inline-block bg-white text-[#2d5a3d] px-8 py-3.5 rounded-full text-sm font-medium hover:-translate-y-0.5 hover:shadow-xl transition-all relative z-10 no-underline"
          >
            Start for Free — No credit card required
          </a>
        </section>
      </main>
      <FooterSection />
    </>
  );
}
