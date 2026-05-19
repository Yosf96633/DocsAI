import Link from "next/link";
import { FileText } from "lucide-react";

export default function FooterSection() {
  return (
    <footer className="bg-[#0f0e0c] px-5 sm:px-8 md:px-12 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white/10 rounded-md flex items-center justify-center">
            <FileText size={13} className="text-white" />
          </div>
          <span className="font-serif text-[1.1rem] text-white">DocsAI</span>
        </div>

        <ul className="flex gap-5 sm:gap-6 list-none">
          {["Privacy", "Terms", "Contact"].map((l) => (
            <li key={l}>
              <Link
                href="#"
                className="text-white/40 text-sm hover:text-white/80 transition-colors no-underline"
              >
                {l}
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-white/30 text-sm">© 2026 DocsAI</p>
      </div>
    </footer>
  );
}