import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "export",
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
