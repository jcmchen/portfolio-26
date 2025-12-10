// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const nextConfig: NextConfig = withMDX({
  // 讓 Next.js 支援 .mdx 與 .md
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"], //"md", "mdx"

  // 其他 Next.js 設定可保留
  reactStrictMode: true,

  // eslint: {
  //   ignoreDuringBuilds: true,
  // },

  // typescript: {
  //   ignoreBuildErrors: true,
  // },
});

export default nextConfig;
