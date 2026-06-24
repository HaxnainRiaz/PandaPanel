import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Pin root when parent folders also contain package-lock.json (avoids wrong workspace root).
    root: __dirname,
  },
  optimizePackageImports: ["lucide-react", "date-fns"],
  productionBrowserSourceMaps: false,
  experimental: {
    // Reduce memory usage during development
    workerThreads: false,
    cpus: 1,
  },
  // Disable source maps in development to save memory if needed, 
  // but let's stick to the above first.
};

export default nextConfig;
