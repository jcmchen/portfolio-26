"use client";

import { MDXProvider } from "@mdx-js/react";
import Image, { ImageProps } from "next/image";
import { ComponentPropsWithoutRef } from "react";

type HeadingProps = ComponentPropsWithoutRef<"h1">;
type SubheadingProps = ComponentPropsWithoutRef<"h2">;
type ParagraphProps = ComponentPropsWithoutRef<"p">;
type AnchorProps = ComponentPropsWithoutRef<"a">;
type MDXImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt?: string;
};

const components = {
  img: ({ className, alt, width, height, ...rest }: MDXImageProps) => (
    <Image
      {...rest}
      src={rest.src}
      alt={alt ?? ""}
      width={width ?? 1200}
      height={height ?? 800}
      className={`rounded-lg shadow-md my-4 mx-auto h-auto w-full ${className ?? ""}`}
    />
  ),
  a: (props: AnchorProps) => (
    <a
      {...props}
      className={`text-[rgb(50,116,216)] hover:underline hover:text-blue-700 ${props.className ?? ""}`}
    />
  ),
  h1: (props: HeadingProps) => (
    <h1 {...props} className={`text-4xl font-bold my-6 text-gray-900 ${props.className ?? ""}`} />
  ),
  h2: (props: SubheadingProps) => (
    <h2 {...props} className={`text-2xl font-semibold my-4 text-gray-800 ${props.className ?? ""}`} />
  ),
  p: (props: ParagraphProps) => (
    <p {...props} className={`text-lg leading-relaxed my-4 text-gray-700 ${props.className ?? ""}`} />
  ),
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MDXProvider components={components}>
      <div className="max-w-5xl mx-auto">
        {children}
      </div>
    </MDXProvider>
  );
}
