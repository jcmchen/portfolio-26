// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const isProd = process.env.NODE_ENV === "production";
const repoName =
  process.env.NEXT_PUBLIC_REPO_NAME ||
  process.env.GITHUB_REPOSITORY?.split("/")[1] ||
  "portfolio";
const basePath = isProd ? `/${repoName}` : "";

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const nextConfig: NextConfig = withMDX({
  // 讓 Next.js 支援 .mdx 與 .md
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"], //"md", "mdx"

  // 其他 Next.js 設定可保留
  reactStrictMode: true,

  // github pages 靜態匯出
  output: "export",

  // next/image 在 export 模式下需要關掉內建 image optimization
  images: {
    unoptimized: true,
  },

  // 部署到「子路徑」時要設定 basePath / assetPrefix
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,

  // eslint: {
  //   ignoreDuringBuilds: true,
  // },

  // typescript: {
  //   ignoreBuildErrors: true,
  // },
});

export default nextConfig;
