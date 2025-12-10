// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// const isProd = process.env.NODE_ENV === "production";
// const REPO_NAME = "portfolio"

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const nextConfig: NextConfig = withMDX({
  // 讓 Next.js 支援 .mdx 與 .md
  pageExtensions: ["ts", "tsx", "js", "jsx"], //"md", "mdx"

  // 其他 Next.js 設定可保留
  reactStrictMode: true,

  // // github pages
  // output: "export",

  // next/image 在 export 模式下需要關掉內建 image optimization
  images: {
    unoptimized: true,
  },

  // // 部署到「子路徑」時要設定 basePath / assetPrefix
  // basePath: isProd ? `/${REPO_NAME}` : "",
  // assetPrefix: isProd ? `/${REPO_NAME}/` : "",

  // eslint: {
  //   ignoreDuringBuilds: true,
  // },

  // typescript: {
  //   ignoreBuildErrors: true,
  // },

});

export default nextConfig;
