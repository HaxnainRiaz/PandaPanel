import Link from "next/link";
import { TreeDeciduous, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-fadeIn">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#0a4019] text-[#d3d3d3] shadow-xl">
          <TreeDeciduous size={40} />
        </div>
        
        <div>
          <h1 className="text-6xl font-heading font-bold text-[#0a4019]">404</h1>
          <p className="text-[#B8A68A] font-medium tracking-[0.2em] uppercase text-sm mt-2">Location Not Found</p>
        </div>
        
        <p className="text-neutral-500 font-medium leading-relaxed">
          The administrative module you are looking for does not exist or has been relocated within the estate.
        </p>
        
        <Link 
          href="/" 
          className="inline-flex items-center gap-3 bg-[#0a4019] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#051712] transition-all shadow-lg shadow-[#0a4019]/20 group active:scale-95"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
