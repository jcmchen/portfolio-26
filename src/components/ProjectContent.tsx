// "use client";

// import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";

// type ProjectContentProps = {
//   source: MDXRemoteSerializeResult;
// };

// // 這裡可以加客製化的 MDX 元件
// const components = {
//   h1: (props: any) => (
//     <h1 {...props} className="text-4xl font-bold mt-6 mb-4" />
//   ),
//   h2: (props: any) => (
//     <h2 {...props} className="text-2xl font-semibold mt-5 mb-3" />
//   ),
//   p: (props: any) => (
//     <p {...props} className="text-lg font-light leading-relaxed mb-4" />
//   ),
//   a: (props: any) => (
//     <a
//       {...props}
//       className="text-black hover:underline"
//     />
//   ),
//   img: (props: any) => (
//   <img
//       {...props}
//       className="w-full max-w-none shadow-lg my-8"
//       alt={props.alt || ""}
//   />
// )
// };

// export default function ProjectContent({ source }: { source: MDXRemoteSerializeResult }) {
//   return (
//     <div className="prose max-w-none">
//       <MDXRemote {...source} components={components} />
//     </div>
//   );
// }

"use client";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import Image, { ImageProps } from "next/image";
import { ComponentPropsWithoutRef } from "react";

type HeadingProps = ComponentPropsWithoutRef<"h1">;
type SubheadingProps = ComponentPropsWithoutRef<"h2">;
type ParagraphProps = ComponentPropsWithoutRef<"p">;
type AnchorProps = ComponentPropsWithoutRef<"a">;
type IframeProps = ComponentPropsWithoutRef<"iframe">;
type MDXImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt?: string;
};

// 自訂 MDX 元件
const components = {
  h1: (props: HeadingProps) => (
    <h1 {...props} className={`text-4xl font-light mt-6 mb-2 shadow-none max-w-1xl mx-left ${props.className ?? ""}`} />
  ),
  h2: (props: SubheadingProps) => (
    <h2 {...props} className={`text-2xl font-normal mt-5 mb-3 shadow-none max-w-1xl mx-left ${props.className ?? ""}`} />
  ),
  h3: (props: SubheadingProps) => (
    <h3 {...props} className={`text-base font-light mt-2 mb-3 shadow-none max-w-1xl mx-left ${props.className ?? ""}`} />
  ),
  p: (props: ParagraphProps) => (
    <p {...props} className={`text-base font-light leading-6 mb-4 shadow-none max-w-2xl mx-left ${props.className ?? ""}`} />
  ),
  a: (props: AnchorProps) => (
    <a {...props} className={`text-black hover:underline shadow-none max-w-1xl mx-left ${props.className ?? ""}`} />
  ),
  iframe: ({ className, ...rest }: IframeProps) => (
    <iframe
      {...rest}
      className={`w-full max-w-3xl aspect-video border-0 ${className ?? ""}`}
      allowFullScreen={rest.allowFullScreen ?? true}
      style={{ ...(rest.style || {}), maxWidth: "100%" }}
    />
  ),
  img: ({ className, alt, width, height, ...rest }: MDXImageProps) => (
    <Image
      {...rest}
      src={rest.src}
      alt={alt ?? ""}
      width={width ?? 1200}
      height={height ?? 800}
      className={`w-screen max-w-[80vw] my-8 shadow-lg object-contain relative h-auto ${className ?? ""}`}
    />
  ),
};

// export default function ProjectContent({
//   source,
// }: {
//   source: MDXRemoteSerializeResult;
// }) {
//   return (
//     <div className="prose max-w-none">
//       <MDXRemote {...source} components={components} />
//     </div>
//   );
// }

export default function ProjectContent({ source }: { source: MDXRemoteSerializeResult }) {
  return (
    <div className="w-screen max-w-[80vw] my-8 object-contain relative left-1/2 -translate-x-1/2">
      <MDXRemote {...source} components={components} />
    </div>
  );
}
