import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProjectContent from "@/components/ProjectContent";

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
  year?: string | number;
};

const projectCovers: Record<string, string> = {
  hygrometric: "/images/hygrometric/cover_long.jpg",
  bridges: "/images/CNV000021-ed.jpg",
  "form-force-matter": "/images/DSC_9959_ed.jpg",
  "resource-rush": "/images/resource-main.png",
  "hanger-games": "/images/sss19-00-ps-ai-bg.png",
  "slime-spring-structure": "/images/sss18-01-c-ai-bg.png",
  interlace: "/images/IMG_1259-ed.jpg",
  "bridge-x": "/images/bridge-x_300ppi.png",
  "fold-and-cut": "/images/DSC_3370-ed.jpg",
  illustrations: "/images/DSC_8999-PS3_BW-c.jpg",
  "sacred-light": "/images/IMG_5087_BW-c.jpg",
  "unidentified-funicular-objects": "/images/IMG_0003-ed.jpg",
  "moment-cube": "/images/moment-cube/DSC08012_REDUCED.jpg",
  yuan: "/images/portfolio/p_Page_38.png",
  "task-and-motion-planning": "/images/chair/0160.png",
  "the-nature-of-growth": "/images/Tree%2001-c.jpeg",
  "mobility-and-housing-taipei": "/images/housing01.png",
  "bio-inspired-composite": "/images/BICM-00.png",
  "botani-plan": "/images/DSC_8958-c.jpg",
  "floating-structures": "/images/IMG_8809-c2.png",
  "tangi-growth": "/images/TUI/Tangi05-ed.jpg",
  "our-grandmas-fridge": "/images/fridge/ogf_mol_2024.png",
  "seeds-starter-kit": "/images/Seed/DSC_7539_bright_02-c3.jpeg",
  "micro-macro": "/images/DSC_9100-c.jpg",
  "capacitive-salad": "/images/TUI/salad-ed.png",
  "computer-graphics-imaging": "/images/cg/cg02.png",
  "recycled-crawler": "/images/TUI/DSC_6518_ED.jpg",
  "granola-cuckoo-clock": "/images/TUI/DSC_6529_ED.jpg",
  "the-rotary-vagary": "/images/1.png",
  "assembled-living": "/images/DSC_7022-c.jpg",
  "boolean-auditorium": "/images/boolean-auditorium/0425_R_Ext_3200_level light 1.42.jpg",
};

function removeProjectPageChrome(content: string) {
  return content
    .replace(/^\s*\[\u2190\s*Back to Projects\]\(\/\?scrollTo=projects\)\s*$/gim, "")
    .replace(/^\s*<div className="row h-6" \/>\s*$/gim, "");
}

function mediaLabel(content: string, hasCover: boolean) {
  const media = [];

  if (hasCover || /(!\[|<img|\bsrc=["']\/images)/i.test(content)) media.push("Images");
  if (/(<iframe|youtube\.com|youtu\.be|vimeo\.com)/i.test(content)) media.push("Video");
  media.push("Text");

  return media.join(" / ");
}

function formatInfoDetail(source: string) {
  return source
    .replace(/<br\s*\/?>/gi, " / ")
    .replace(/&#58;/g, ":")
    .replace(/&emsp;/g, " ")
    .replace(/\s+/g, " ")
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
  const matches = `${year || ""} ${source}`.match(/\b(?:20\d{2}|19\d{2})(?:\s*[-\u2013]\s*(?:20\d{2}|19\d{2}))?\b/g);

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
  const type = projectTypeLabel(infoSource);
  const showInfoDetail = infoDetail && infoDetail.toLowerCase() !== type.toLowerCase();
  const year = yearLabel(data.year, infoSource);
  const cover = projectCovers[slug];
  const bodyContent = removeProjectPageChrome(content);
  const media = mediaLabel(bodyContent, Boolean(cover));

  return (
    <main className="bg-[#fbfaf7] px-4 py-8 md:px-8 md:py-12">
      <header className="mx-auto max-w-[1680px]">
        <Link
          href="/?scrollTo=projects"
          className="inline-block text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-500 transition hover:text-black hover:underline hover:underline-offset-4"
        >
          {"\u2190"} Back to projects
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
              />
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto mt-12 grid max-w-[1680px] gap-10 md:mt-16 lg:grid-cols-[minmax(280px,0.32fr)_minmax(0,0.68fr)] lg:gap-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <a
            href="#project-content"
            className="mb-5 inline-block text-[11px] font-normal uppercase tracking-[0.14em] text-black hover:underline hover:underline-offset-4"
          >
            Read documentation
          </a>
          <dl className="grid max-w-[520px] gap-3 text-[11px] font-normal uppercase leading-5 tracking-[0.14em]">
            <div className="grid grid-cols-[96px_1fr] gap-4 border-t border-neutral-300 pt-3">
              <dt className="text-neutral-400">Type</dt>
              <dd className="text-neutral-700">
                {showInfoDetail ? `${type} / ${infoDetail}` : type}
              </dd>
            </div>
            {year ? (
              <div className="grid grid-cols-[96px_1fr] gap-4 border-t border-neutral-300 pt-3">
                <dt className="text-neutral-400">Year</dt>
                <dd className="text-neutral-700">{year}</dd>
              </div>
            ) : null}
            <div className="grid grid-cols-[96px_1fr] gap-4 border-t border-neutral-300 pt-3">
              <dt className="text-neutral-400">Media</dt>
              <dd className="text-neutral-700">{media}</dd>
            </div>
          </dl>
        </aside>

        <div className="min-w-0">
          <ProjectContent source={bodyContent} />
        </div>
      </div>
    </main>
  );
}
