// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
//       <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={180}
//           height={38}
//           priority
//         />
//         <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
//           <li className="mb-2 tracking-[-.01em]">
//             Get started by editing{" "}
//             <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
//               src/app/page.tsx
//             </code>
//             .
//           </li>
//           <li className="tracking-[-.01em]">
//             Save and see your changes instantly.
//           </li>
//         </ol>

//         <div className="flex gap-4 items-center flex-col sm:flex-row">
//           <a
//             className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={20}
//               height={20}
//             />
//             Deploy now
//           </a>
//           <a
//             className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Read our docs
//           </a>
//         </div>
//       </main>
//       <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/file.svg"
//             alt="File icon"
//             width={16}
//             height={16}
//           />
//           Learn
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/window.svg"
//             alt="Window icon"
//             width={16}
//             height={16}
//           />
//           Examples
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/globe.svg"
//             alt="Globe icon"
//             width={16}
//             height={16}
//           />
//           Go to nextjs.org →
//         </a>
//       </footer>
//     </div>
//   );
// }

// import Link from "next/link";

// export default function Home() {
//   return (
//     <main className="p-8">
//       <h1 className="text-4xl font-bold">Welcome to My Portfolio</h1>
//       <p className="mt-4">Explore my projects below:</p>
//       <Link href="/projects" className="text-blue-600 underline mt-6 block">
//         Go to Projects
//       </Link>
//     </main>
//   );
// }

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FilterBar from "@/components/FilterBar";
import HeroSlider from "@/components/HeroSlider";
import ProjectCard from "@/components/ProjectCard";

// const projects = [
//   { id: 1, slug: "morphing-wood", title: "Morphing Wood", img: "/images/image12.png" },
//   { id: 2, slug: "energy-retrofit", title: "Energy Retrofit", img: "/images/image13.png" },
//   { id: 3, slug: "data-visualization", title: "Data Visualization", img: "/images/image14.png" },
//   { id: 4, slug: "morphing-wood", title: "Morphing Wood", img: "/images/image12.png" },
//   { id: 5, slug: "energy-retrofit", title: "Energy Retrofit", img: "/images/image13.png" },
//   { id: 6, slug: "data-visualization", title: "Data Visualization", img: "/images/image14.png" },
//   { id: 7, slug: "morphing-wood", title: "Morphing Wood", img: "/images/image12.png" },
//   { id: 8, slug: "energy-retrofit", title: "Energy Retrofit", img: "/images/image13.png" },
//   { id: 9, slug: "data-visualization", title: "Data Visualization", img: "/images/image14.png" },
//   { id: 10, slug: "morphing-wood", title: "Morphing Wood", img: "/images/image12.png" },
//   { id: 11, slug: "energy-retrofit", title: "Energy Retrofit", img: "/images/image13.png" },
//   { id: 12, slug: "data-visualization", title: "Data Visualization", img: "/images/image14.png" },
//   { id: 13, slug: "morphing-wood", title: "Morphing Wood", img: "/images/image12.png" },
//   { id: 14, slug: "energy-retrofit", title: "Energy Retrofit", img: "/images/image13.png" },
//   { id: 15, slug: "data-visualization", title: "Data Visualization", img: "/images/image14.png" },
//   { id: 16, slug: "morphing-wood", title: "Morphing Wood", img: "/images/image12.png" },
//   { id: 17, slug: "energy-retrofit", title: "Energy Retrofit", img: "/images/image13.png" }
// ];

const projects = [
  { slug: "bridges", title: "Bridges", year:"2017-2018", category: "Construction / Fabrication", img: "/images/CNV000021-ed.jpg" },
  { slug: "form-force-matter", title: "Form Force Matter", year: 2021, category: "Construction / Fabrication", img: "/images/DSC_9959_ed.jpg" }, 
  { slug: "resource-rush", title: "Resource Rush", year: 2023, category: "Robotics", img: "/images/resource-main.png" },
  { slug: "hanger-games", title: "Hanger Games", year: 2019, category: "Construction / Fabrication", img: "/images/sss19-00-ps-ai-bg.png" },
  { slug: "slime-spring-structure", title: "Slime Spring Structure", year: 2018, category: "Construction / Fabrication", img: "/images/sss18-01-c-ai-bg.png" },
  { slug: "interlace", title: "Interlace", year: 2018, category: "Construction / Fabrication", img: "/images/IMG_1259-ed.jpg" },
  { slug: "bridge-x", title: "Bridge X", year: 2021, category: "Construction / Fabrication", img: "/images/bridge-x_300ppi.png" },
  { slug: "fold-and-cut", title: "Fold & Cut", year: 2017, category: "Perception", img: "/images/DSC_3370-ed.jpg" },
  { slug: "illustrations", title: "Illustrations", year: "2019-2021", category: "Perception", img: "/images/DSC_8999-PS3_BW-c.jpg" },
  { slug: "sacred-light", title: "Sacred Light", year: 2020, category: "Perception", img: "/images/IMG_5087_BW-c.jpg" },
  { slug: "unidentified-funicular-objects", title: "Unidentified Funicular Objects", year: "2017", category: "Construction / Fabrication", img: "/images/IMG_0003-ed.jpg" },
  { slug: "moment-cube", title: "MomentCube", year: 2022, category: "New Media", img: "/images/moment-cube/DSC08012_REDUCED.jpg" },
  { slug: "yuan", title: "Yuan", year: 2023, category: "Perception", img: "/images/portfolio/p_Page_38.png" },
  { slug: "task-and-motion-planning", title: "Task and Motion Planning for Robotic Assembly", year: 2023, category: "Robotics", img: "/images/chair/0160.png" },
  { slug: "the-nature-of-growth", title: "The Nature of Growth", year: 2019, category: "Nature", img: "/images/Tree%2001-c.jpeg" },
  { slug: "mobility-and-housing-taipei", title: "Mobility and Housing in Taipei", year: 2021, category: "Visualization", img: "/images/housing01.png" },
  { slug: "bio-inspired-composite", title: "Bio-Inspired Composite Materials", year: 2019, category: "Nature", img: "/images/BICM-00.png" },
  { slug: "botani-plan", title: "Botani Plan: Second Nature", year: 2020, category: "Nature", img: "/images/DSC_8958-c.jpg" },
  { slug: "floating-structures", title: "Floating Structures", year: "2019-2020", category: "Nature", img: "/images/IMG_8809-c2.png" },
  { slug: "tangi-growth", title: "TangiGrowth", year: 2022, category: "New Media", img: "/images/TUI/Tangi05-ed.jpg" },
  { slug: "capacitive-salad", title: "Capacitive Salad", year: 2022, category: "New Media", img: "/images/TUI/salad-ed.png" },
  { slug: "seeds-starter-kit", title: "Seeds Starter Kit", year: 2023, category: "Nature", img: "/images/Seed/DSC_7539_bright_02-c3.jpeg" },
  { slug: "micro-macro", title: "Micro Macro", year: "2019-2020", category: "Perception", img: "/images/DSC_9100-c.jpg" },
  { slug: "our-grandmas-fridge", title: "Our Grandma's Fridge", year: 2023, category: "New Media", img: "/images/fridge/__Our+Grandma’s+Fridge+MOL+2024.webp" },
  { slug: "recycled-crawler", title: "Recycled Crawler", year: 2022, category: "New Media", img: "/images/TUI/DSC_6518_ED.jpg" },
  { slug: "granola-cuckoo-clock", title: "Granola Cuckoo Clock", year: 2022, category: "New Media", img: "/images/TUI/DSC_6529_ED.jpg" },
  { slug: "the-rotary-vagary", title: "The Rotary Vagary", year: 2023, category: "Building", img: "/images/1.png" },
  { slug: "assembled-living", title: "Assembled Living", year: 2022, category: "Building", img: "/images/DSC_7022-c.jpg" },
  { slug: "boolean-auditorium", title: "Boolean Auditorium", year: 2022, category: "Building", img: "/images/boolean-auditorium/0425_R_Ext_3200_level light 1.42.jpg" },

];

// export default function HomePage() {
//   return (
//     <div>
//       <HeroSlider />
//       <div className="p-8">
//         <div className="max-w-5xl mx-auto"> {/* 控制整體寬度 */}
//           <h1 className="text-4xl font-bold mb-6 text-center">Projects</h1>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
//             {projects.map((p) => (
//               <ProjectCard key={p.id} project={p} />
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>

//   );
// }

// export default function HomePage() {
//   const [active, setActive] = useState("Show All");

//   const categories = [
//     { name: "Show All", count: projects.length },
//     ...Array.from(new Set(projects.map((p) => p.category))).map((cat) => ({
//       name: cat,
//       count: projects.filter((p) => p.category === cat).length,
//     })),
//   ];

//   const filtered =
//     active === "Show All" ? projects : projects.filter((p) => p.category === active);

//   return (
//     <div>
//       <HeroSlider />
//       <div className="p-8">
//         <div className="max-w-6xl mx-auto">
//           {/* <h1 className="text-4xl font-bold mb-6 text-center">Projects</h1> */}

//           <FilterBar categories={categories} active={active} setActive={setActive} />

//           {/* ✅ AnimatePresence 包裹 ProjectCard */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
//             <AnimatePresence>
//               {filtered.map((project) => (
//                 <motion.div
//                   key={project.slug}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -20 }}
//                   transition={{ duration: 0.4 }}
//                 >
//                   <ProjectCard project={project} />
//                 </motion.div>
//               ))}
//             </AnimatePresence>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

export default function HomePage() {
  const [active, setActive] = useState("Show All");

  // 計算分類與數量
  const categories = [
    { name: "Show All", count: projects.length },
    ...Array.from(new Set(projects.map((p) => p.category))).map((cat) => ({
      name: cat,
      count: projects.filter((p) => p.category === cat).length,
    })),
  ];

  // 過濾項目
  const filtered =
    active === "Show All"
      ? projects
      : projects.filter((p) => p.category === active);

  return (
    <div>
      <HeroSlider />

      {/* Projects 區域（Header Projects 會捲動到這裡） */}
      <div id="projects-section" className="p-8 scroll-mt-24">
        <div className="max-w-7xl mx-auto"> 
          <FilterBar categories={categories} active={active} setActive={setActive} />

          {/* ✅ AnimatePresence 包裹 ProjectCard *//*filter完沒有三個row 也有最小高度 */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8 min-h-[800px]"> 
            <AnimatePresence>
              {filtered.map((project) => (
                <motion.div
                  key={project.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div> */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 mt-8 min-h-[800px]">
            <AnimatePresence>
              {filtered.map((project) => (
                <motion.div
                  key={project.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="mb-6 break-inside-avoid" // 🔑 確保卡片不被拆開
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
