"use client";

import { motion } from "framer-motion";
import { MessageSquare, Shield, BookOpen } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Chat with Documents",
    description:
      "Ask questions in plain English and get answers grounded directly in your actual document — not generic legal knowledge.",
  },
  {
    icon: Shield,
    title: "Compliance Check",
    description:
      "Upload compliance documents and instantly verify key obligations, deadlines, and requirements without reading every page.",
  },
  {
    icon: BookOpen,
    title: "Exact Citations",
    description:
      "Every answer references the exact page, section, and position in the document. No hallucinations. Full traceability.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 sm:py-20 md:py-24 px-5 sm:px-8 md:px-12 bg-[#ede9e0]">
      <div className="max-w-6xl mx-auto">
        <div className="text-xs font-medium tracking-widest uppercase text-[#2d5a3d] mb-3">
          Capabilities
        </div>
        <h2 className="font-serif text-[1.9rem] sm:text-[2.2rem] md:text-[2.4rem] text-[#0f0e0c] mb-10 sm:mb-12 md:mb-14 max-w-lg">
          Everything you need to understand your documents
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.12 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white border border-black/10 rounded-2xl p-6 sm:p-7 md:p-8"
            >
              <div className="w-11 h-11 bg-[#2d5a3d]/8 rounded-xl flex items-center justify-center mb-4 sm:mb-5">
                <f.icon size={22} className="text-[#2d5a3d]" />
              </div>
              <h3 className="font-serif text-[1.1rem] sm:text-[1.15rem] mb-2 sm:mb-2.5 text-[#0f0e0c]">
                {f.title}
              </h3>
              <p className="text-sm text-[#5a5852] leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}