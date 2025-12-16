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
  const headerMeta = (data.category || "Project").toUpperCase();
  const headerDesc = data.description || data.description_in || "";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-3">{headerMeta}</p>
        <h1 className="text-4xl md:text-5xl font-light text-gray-900">{headerTitle}</h1>
        {headerDesc ? <p className="text-gray-600 mt-4 max-w-3xl whitespace-pre-line">{headerDesc}</p> : null}
      </header>

      <ProjectContent source={content} />
    </div>
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
