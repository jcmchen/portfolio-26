// export default function ProjectDetail({ params }) {
//   const { slug } = params;

//   // 模擬作品資料庫
//   const projectData = {
//     "morphing-wood": {
//       title: "Morphing Wood",
//       description: "A humidity-responsive morphing wood prototype.",
//       img: "/images/p1.jpg",
//     },
//     "energy-retrofit": {
//       title: "Energy Retrofit",
//       description: "A study on sustainable building retrofits.",
//       img: "/images/p2.jpg",
//     },
//     "data-visualization": {
//       title: "Data Visualization",
//       description: "Interactive visualization of urban housing data.",
//       img: "/images/p3.jpg",
//     },
//   };

//   const project = projectData[slug];

//   if (!project) return <h1>Project Not Found</h1>;

//   return (
//     <div className="p-8 max-w-3xl mx-auto">
//       <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
//       <img src={project.img} alt={project.title} className="rounded-lg mb-6" />
//       <p className="text-lg">{project.description}</p>
//     </div>
//   );
// }

// import fs from "fs";
// import path from "path";
// import matter from "gray-matter";
// import { serialize } from "next-mdx-remote/serialize";
// import ProjectContent from "@/components/ProjectContent";

// export default async function ProjectPage({ params }: { params: { slug: string } }) {
//   const filePath = path.join(process.cwd(), "content/projects", `${params.slug}.mdx`);
//   const fileContents = fs.readFileSync(filePath, "utf-8");

//   const { content, data } = matter(fileContents);
//   const mdxSource = await serialize(content);

//   return (
//     <div className="max-w-5xl mx-auto px-6 py-12">
//       <h1 className="text-4xl font-bold mb-6">{data.title}</h1>
//       <ProjectContent source={mdxSource} />
//     </div>
//   );
// }

import fs from "fs";
import path from "path";
import matter from "gray-matter";
// import { serialize } from "next-mdx-remote/serialize";
import { notFound } from "next/navigation";
import ProjectContent from "@/components/ProjectContent";
import Image from "next/image";
import Link from "next/link";

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
  // const { slug } = await params;
  // const filePath = path.join(process.cwd(), "src/app/projects", `${slug}.mdx`);
  // const fileContent = fs.readFileSync(filePath, "utf8");

  // const { content, data } = matter(fileContent) as { content: string; data: Frontmatter };
  // const mdxSource = await serialize(content);
  const { slug } = await Promise.resolve(params);

  const filePath = path.join(process.cwd(), "src/app/projects", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) notFound();

  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(fileContent) as { content: string; data: Frontmatter };


  const headerTitle = data.title || slug.replace(/-/g, " ");
  const headerMeta = data.category || "Project";
  const headerDesc = data.description || data.description_in || "";
  const cover = projectCovers[slug];

  return (
    <main className="bg-[#fbfaf7] px-4 py-8 md:px-8 md:py-12">
      <header className="mx-auto grid max-w-[1680px] gap-6 border-b border-black pb-8 md:grid-cols-[0.78fr_1.22fr] md:gap-8">
        <div className="grid content-between gap-8 border-black md:border-r md:pr-8">
          <div>
            <Link
              href="/?scrollTo=projects"
              className="inline-block border-b border-black pb-1 text-xs uppercase tracking-[0.14em] hover:border-neutral-400 hover:text-neutral-500"
            >
              Back to projects
            </Link>
            <p className="mt-8 text-xs uppercase tracking-[0.18em] text-neutral-500">
              {headerMeta}
            </p>
            <h1 className="mt-3 text-[clamp(3rem,8vw,8.5rem)] font-light leading-[0.9] tracking-normal">
              {headerTitle}
            </h1>
          </div>

          {headerDesc ? (
            <p className="max-w-2xl whitespace-pre-line border-t border-black pt-4 text-base leading-7 text-neutral-700">
              {headerDesc}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3">
          {cover ? (
            <div className="project-hero-image relative min-h-[44vh] overflow-hidden bg-[#e8e6df] md:min-h-[72vh]">
              <Image
                src={cover}
                alt={headerTitle}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 58vw"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="grid grid-cols-3 border-y border-black py-3 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
            <span>{data.year || "Project"}</span>
            <span className="text-center">Archive</span>
            <span className="text-right">{slug}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] gap-10 py-10 md:grid-cols-[0.26fr_0.74fr] md:py-14">
        <aside className="hidden md:block">
          <div className="sticky top-24 grid gap-5 border-t border-black pt-4 text-xs uppercase tracking-[0.14em]">
            <div className="grid grid-cols-[1fr_auto] border-b border-neutral-300 pb-3">
              <span>Category</span>
              <span className="text-neutral-500">{headerMeta}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] border-b border-neutral-300 pb-3">
              <span>Media</span>
              <span className="text-neutral-500">Images / Text</span>
            </div>
            <a href="#project-content" className="border-b border-neutral-300 pb-3 hover:underline">
              Read documentation
            </a>
          </div>
        </aside>

        <ProjectContent source={content} />
      </div>
    </main>
  );
}


// import fs from "fs";
// import path from "path";
// import matter from "gray-matter";
// import { serialize } from "next-mdx-remote/serialize";
// import ProjectContent from "@/components/ProjectContent";
// import Link from "next/link";

// type ProjectPageProps = {
//   params: {
//     slug: string;
//   };
// };

// // 🔹 告訴 Next：有哪些 slug 要在 build 時預先輸出
// export function generateStaticParams() {
//   // 依照你放 MDX 的路徑調整，如果你確定放在 src/app/projects 就用這個
//   const projectsDir = path.join(process.cwd(), "src/app/projects");

//   // 讀資料夾底下所有檔案
//   const files = fs.readdirSync(projectsDir);

//   // 只抓 .mdx / .md 檔，轉成 { slug } 陣列
//   return files
//     .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
//     .map((file) => ({
//       slug: file.replace(/\.mdx?$/, ""),
//     }));
// }

// export default async function ProjectPage({ params }: ProjectPageProps) {
//   const filePath = path.join(
//     process.cwd(),
//     "src/app/projects",
//     `${params.slug}.mdx`
//   );

//   const fileContent = fs.readFileSync(filePath, "utf8");
//   const { content, data } = matter(fileContent);
//   const mdxSource = await serialize(content);

//   return (
//     <div className="max-w-5xl mx-auto px-6 py-16">
//       {/* Back to Projects */}
//       <Link
//         href="/?scrollTo=projects"
//         className="inline-block mb-6 px-4 py-2 rounded bg-[rgb(50,116,216)] text-white hover:bg-[rgb(40,100,190)] transition"
//       >
//         ← Back to Projects
//       </Link>

//       {/* optional: frontmatter title */}
//       {data?.title && (
//         <h1 className="text-4xl font-normal mb-6">{data.title}</h1>
//       )}

//       <ProjectContent source={mdxSource} />
//     </div>
//   );
// }
