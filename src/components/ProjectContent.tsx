import { MDXRemote } from "next-mdx-remote/rsc";
import Image, { ImageProps } from "next/image";
import { Children, ComponentPropsWithoutRef, isValidElement } from "react";

type HeadingProps = ComponentPropsWithoutRef<"h1">;
type SubheadingProps = ComponentPropsWithoutRef<"h2">;
type ParagraphProps = ComponentPropsWithoutRef<"p">;
type AnchorProps = ComponentPropsWithoutRef<"a">;
type IframeProps = ComponentPropsWithoutRef<"iframe">;
type MDXImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt?: string;
};

const MDXImage = ({ className, alt, width, height, ...rest }: MDXImageProps) => {
  const showCaption = alt && alt.trim().toLowerCase() !== "cover";

  return (
    <figure className="group my-12">
    <Image
      {...rest}
      src={rest.src}
      alt={alt ?? ""}
      width={width ?? 1400}
      height={height ?? 950}
      className={`relative h-auto w-full object-contain transition duration-500 group-hover:grayscale-0 md:grayscale-[8%] ${className ?? ""}`}
    />
    {showCaption ? (
      <figcaption className="mt-2 text-[10px] font-normal uppercase tracking-[0.14em] text-neutral-500">
        {alt}
      </figcaption>
    ) : null}
  </figure>
  );
};

const hasBlockChild = (children: ParagraphProps["children"]) =>
  Children.toArray(children).some((child) => {
    if (!isValidElement(child)) return false;

    return child.type === MDXImage || child.type === "figure";
  });

const components = {
  h1: (props: HeadingProps) => (
    <h1
      {...props}
      className={`mt-16 text-3xl font-light leading-tight shadow-none md:text-5xl ${props.className ?? ""}`}
    />
  ),
  h2: (props: SubheadingProps) => (
    <h2
      {...props}
      className={`mt-14 text-2xl font-light uppercase tracking-[0.04em] shadow-none md:text-3xl ${props.className ?? ""}`}
    />
  ),
  h3: (props: SubheadingProps) => (
    <h3
      {...props}
      className={`mt-8 text-sm font-normal uppercase tracking-[0.14em] text-neutral-500 shadow-none ${props.className ?? ""}`}
    />
  ),
  p: ({ children, className, ...rest }: ParagraphProps) => {
    const classes = `mb-5 max-w-[760px] text-[15px] font-normal leading-7 text-neutral-700 shadow-none ${className ?? ""}`;

    if (hasBlockChild(children)) {
      return (
        <div {...rest} className={classes}>
          {children}
        </div>
      );
    }

    return (
      <p {...rest} className={classes}>
        {children}
      </p>
    );
  },
  a: (props: AnchorProps) => (
    <a
      {...props}
      className={`font-bold text-black transition hover:underline hover:underline-offset-4 ${props.className ?? ""}`}
    />
  ),
  iframe: ({ className, ...rest }: IframeProps) => (
    <div className="my-12">
      <iframe
        {...rest}
        className={`aspect-video w-full border-0 ${className ?? ""}`}
        allowFullScreen={rest.allowFullScreen ?? true}
        style={{ ...(rest.style || {}), maxWidth: "100%" }}
      />
    </div>
  ),
  img: MDXImage,
};

export default function ProjectContent({ source }: { source: string }) {
  return (
    <section id="project-content" className="project-content w-full">
      <MDXRemote source={source} components={components} />
    </section>
  );
}
