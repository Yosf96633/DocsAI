"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Rocket, Play, FileText, BookmarkIcon } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut", delay },
  }),
};

const pills = [
  "Talk with your documents using intelligent AI",
  "Check compliance obligations instantly",
  "Exact citations — no hallucinations",
];

export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center px-5 sm:px-8 md:px-12 pt-24 sm:pt-28 pb-12 sm:pb-16 relative overflow-hidden">
      {/* bg glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 70% 50%, rgba(45,90,61,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 15% 80%, rgba(184,134,11,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* LEFT */}
        <div>
          <motion.div
            custom={0.1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="inline-flex items-center gap-2 bg-[#2d5a3d]/10 border border-[#2d5a3d]/20 rounded-full px-4 py-1.5 text-xs font-medium text-[#2d5a3d] mb-5 sm:mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d5a3d] animate-pulse" />
            AI-Powered Legal Assistant
          </motion.div>

          <motion.h1
            custom={0.25}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-serif text-[2.6rem] sm:text-[3rem] lg:text-[3.5rem] leading-[1.1] text-[#0f0e0c] mb-4 sm:mb-5"
          >
            Chat with Your
            <br />
            <em className="text-[#2d5a3d]">Legal Documents</em>
          </motion.h1>

          <motion.p
            custom={0.4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-[1rem] sm:text-[1.05rem] text-[#5a5852] font-light mb-7 sm:mb-8 max-w-[480px] leading-relaxed"
          >
            Upload any contract, NDA, or compliance document and get instant,
            cited answers — no hallucinations, no guesswork.
          </motion.p>

          <motion.div
            custom={0.55}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-col gap-2 mb-8 sm:mb-10"
          >
            {pills.map((p) => (
              <div key={p} className="flex items-center gap-2.5 text-sm text-[#5a5852]">
                <div className="w-[18px] h-[18px] rounded-full bg-[#ede9e0] border border-[#2d5a3d]/30 flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-[#2d5a3d]" />
                </div>
                {p}
              </div>
            ))}
          </motion.div>

          <motion.div
            custom={0.7}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-3 flex-wrap"
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#2d5a3d] text-white text-sm font-medium hover:bg-[#4a8a5f] transition-all hover:-translate-y-0.5 no-underline"
            >
              <Rocket size={15} />
              Get Started for Free
            </Link>
            <button className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-black/20 text-[#0f0e0c] text-sm font-medium hover:bg-[#ede9e0] transition-colors">
              <Play size={13} />
              See How It Works
            </button>
          </motion.div>
        </div>

        {/* RIGHT — Illustration card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: [0, -12, 0],
          }}
          transition={{
            opacity: { duration: 0.8, delay: 0.4 },
            y: {
              duration: 6,
              delay: 0.4,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            },
          }}
          className="flex items-center justify-center"
        >
          <div className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 w-full max-w-[340px] shadow-[0_2px_40px_rgba(15,14,12,0.06)] relative">
            {/* verdict chip */}
            <div className="absolute -top-3 right-6 bg-white border border-[#2d5a3d]/30 rounded-full px-3 py-1 text-xs font-medium text-[#2d5a3d] flex items-center gap-1.5 shadow-sm">
              <Check size={11} />
              NDA · Approved
            </div>

            {/* doc header */}
            <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-black/8">
              <div className="w-9 h-9 bg-[#2d5a3d]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-[#2d5a3d]" />
              </div>
              <div>
                <div className="text-sm font-medium">Mutual_NDA_2026.pdf</div>
                <div className="text-xs text-[#9a9690]">12 chunks · Indexed</div>
              </div>
            </div>

            {/* human bubble */}
            <div className="ml-auto max-w-[80%] bg-[#2d5a3d] text-white rounded-xl rounded-tr-sm px-3.5 py-2.5 text-[0.78rem] leading-relaxed mb-2.5">
              What are the obligations of the receiving party?
            </div>

            {/* ai bubble */}
            <div className="bg-[#f7f4ef] border border-black/8 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-[0.78rem] leading-relaxed text-[#0f0e0c]">
              The Receiving Party shall hold and maintain all Confidential
              Information in strict confidence
              <span className="inline-block w-0.5 h-3 bg-[#2d5a3d] rounded ml-0.5 animate-pulse align-middle" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 bg-[#ede9e0] border border-black/10 rounded-full px-2 py-0.5 text-[0.68rem] text-[#5a5852]">
                  <BookmarkIcon size={9} className="text-[#2d5a3d]" />
                  NDA.pdf · Page 1 · Middle
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}