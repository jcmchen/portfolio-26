import { MDXRemote } from "next-mdx-remote/rsc";
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

const components = {
  h1: (props: HeadingProps) => (
    <h1 {...props} className={`text-4xl font-light mt-6 mb-2 shadow-none ${props.className ?? ""}`} />
  ),
  h2: (props: SubheadingProps) => (
    <h2 {...props} className={`text-2xl font-normal mt-5 mb-3 shadow-none ${props.className ?? ""}`} />
  ),
  h3: (props: SubheadingProps) => (
    <h3 {...props} className={`text-base font-light mt-2 mb-3 shadow-none ${props.className ?? ""}`} />
  ),
  p: (props: ParagraphProps) => (
    <p {...props} className={`text-base font-light leading-6 mb-4 shadow-none ${props.className ?? ""}`} />
  ),
  a: (props: AnchorProps) => (
    <a {...props} className={`text-black hover:underline shadow-none ${props.className ?? ""}`} />
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
      className={`w-full my-8 shadow-lg object-contain relative h-auto ${className ?? ""}`}
    />
  ),
};

export default function ProjectContent({ source }: { source: string }) {
  return (
    <div className="w-full my-8">
      <MDXRemote source={source} components={components} />
    </div>
  );
}

