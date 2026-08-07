import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProjectContent from "@/components/ProjectContent";
import { getProject } from "@/data/projects";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Frontmatter = {
  title?: string;
  description?: string;
  description_in?: string;
  category?: string;
  type?: string;
  year?: string | number;
};

function removeProjectPageChrome(content: string) {
  return content
    .replace(/^\s*\[\u2190\s*Back to Projects\]\(\/\?scrollTo=projects\)\s*$/gim, "")
    .replace(/^\s*<div className="row h-6" \/>\s*$/gim, "");
}

function formatInfoDetail(source: string) {
  return source
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&#58;/g, ":")
    .replace(/&emsp;/g, " ")
    .replace(/\s*\|\s*/g, "\n")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function projectTypeLabel(source: string) {
  const normalized = source.toLowerCase();

  if (/personal interest/.test(normalized)) return "Personal Interest";
  if (/(chi|acadia|research|lab|ncree|intern|publication|paper)/.test(normalized)) {
    return "Research Project";
  }
  if (/(instructor|course|class|workshop|seminar|studio|foundation|fundamentals|uc berkeley|ntu|eth)/.test(normalized)) {
    return "Class Project";
  }

  return "Project";
}

function yearLabel(year: Frontmatter["year"], source: string) {
  const explicitYear = year === undefined || year === null ? "" : String(year).trim();
  const matches = (explicitYear || source).match(
    /\b(?:20\d{2}|19\d{2})(?:\s*[-\u2013]\s*(?:20\d{2}|19\d{2}))?\b/g
  );

  if (!matches) return undefined;

  return Array.from(new Set(matches.map((match) => match.replace(/\s*[-\u2013]\s*/g, "-")))).join(" / ");
}

export function generateStaticParams() {
  const projectsDir = path.join(process.cwd(), "src/app/projects");
  const files = fs.readdirSync(projectsDir);

  return files
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
    .map((file) => ({
      slug: file.replace(/\.mdx?$/, ""),
    }));
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await Promise.resolve(params);
  const filePath = path.join(process.cwd(), "src/app/projects", `${slug}.mdx`);

  if (!fs.existsSync(filePath)) notFound();

  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(fileContent) as { content: string; data: Frontmatter };
  const title = data.title || slug.replace(/-/g, " ");
  const infoDetail = formatInfoDetail(data.description || data.description_in || "");
  const infoSource = [data.description, data.description_in].filter(Boolean).join(" ");
  const category = data.category || "Project";
  const type = data.type || projectTypeLabel(infoSource);
  const showInfoDetail = infoDetail && infoDetail.toLowerCase() !== type.toLowerCase();
  const year = yearLabel(data.year, infoSource);
  const project = getProject(slug);
  const cover = project?.cover;
  const bodyContent = removeProjectPageChrome(content);

  return (
    <main className="bg-[#fbfaf7] px-4 py-8 md:px-8 md:py-12">
      <header className="mx-auto max-w-[1680px]">
        <Link
          href="/?scrollTo=projects"
          aria-label="Back to projects"
          className="group inline-flex items-center gap-1.5 text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:text-black"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:-translate-x-px group-focus-visible:-translate-x-px"
          >
            {"\u2190"}
          </span>
          <span className="group-hover:underline group-hover:underline-offset-4 group-focus-visible:underline group-focus-visible:underline-offset-4">
            Back to projects
          </span>
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-end">
          <div className="max-w-[680px]">
            <p className="mb-3 text-[13px] font-normal uppercase tracking-[0.28em] text-neutral-500">
              {category}
            </p>
            <h1 className="text-[clamp(2.5rem,6vw,6.5rem)] font-light leading-[0.95] tracking-normal">
              {title}
            </h1>
          </div>

          {cover ? (
            <div className="relative aspect-[3/2] overflow-hidden bg-[#e8e6df]">
              <Image
                src={cover}
                alt={title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 54vw"
                className="object-cover"
                style={{ objectPosition: project?.coverPosition ?? "center" }}
              />
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto mt-12 grid max-w-[1680px] gap-10 md:mt-16 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <a
            href="#project-content"
            aria-label="Jump to project content"
            className="group mb-5 inline-flex items-center gap-1.5 text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-500 transition-colors hover:text-black"
          >
            <span className="group-hover:underline group-hover:underline-offset-4 group-focus-visible:underline group-focus-visible:underline-offset-4">
              Project Details
            </span>
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-px group-focus-visible:translate-x-px"
            >
              {"\u2192"}
            </span>
          </a>
          <dl className="grid w-full font-normal">
            <div className="grid grid-cols-[52px_1fr] gap-3 border-t border-neutral-300 py-3">
              <dt className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">Type</dt>
              <dd className="text-xs leading-5 text-neutral-700">{type}</dd>
            </div>
            {year ? (
              <div className="grid grid-cols-[52px_1fr] gap-3 border-t border-neutral-300 py-3">
                <dt className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">Year</dt>
                <dd className="text-xs leading-5 text-neutral-700">{year}</dd>
              </div>
            ) : null}
            {showInfoDetail ? (
              <div className="grid grid-cols-[52px_1fr] gap-3 border-t border-neutral-300 py-3">
                <dt className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">Info</dt>
                <dd className="whitespace-pre-line text-xs leading-5 text-neutral-700">
                  {infoDetail}
                </dd>
              </div>
            ) : null}
            {project?.resources?.length ? (
              <div className="grid grid-cols-[52px_1fr] gap-3 border-t border-neutral-300 py-3">
                <dt className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">Links</dt>
                <dd className="flex flex-wrap items-center gap-x-1.5 text-xs leading-5 text-neutral-700">
                  {project.resources.map((resource, index) => (
                    <span key={resource.href} className="inline-flex items-center gap-1.5">
                      {index > 0 ? (
                        <span aria-hidden="true" className="text-neutral-400">
                          |
                        </span>
                      ) : null}
                      <a
                        href={resource.href}
                        target="_blank"
                        rel="noreferrer"
                        className="border-b border-neutral-500 transition-colors hover:border-black hover:text-black"
                      >
                        {resource.text}
                      </a>
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </aside>

        <div className="min-w-0 w-full max-w-[1120px] lg:justify-self-center">
          <ProjectContent source={bodyContent} />
        </div>
      </div>
    </main>
  );
}
