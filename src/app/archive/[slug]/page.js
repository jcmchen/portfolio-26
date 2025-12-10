export default function ProjectDetail({ params }) {
  const { slug } = params;

  // 模擬作品資料庫
  const projectData = {
    "morphing-wood": {
      title: "Morphing Wood",
      description: "A humidity-responsive morphing wood prototype.",
      img: "/images/p1.jpg",
    },
    "energy-retrofit": {
      title: "Energy Retrofit",
      description: "A study on sustainable building retrofits.",
      img: "/images/p2.jpg",
    },
    "data-visualization": {
      title: "Data Visualization",
      description: "Interactive visualization of urban housing data.",
      img: "/images/p3.jpg",
    },
  };

  const project = projectData[slug];

  if (!project) return <h1>Project Not Found</h1>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
      <img src={project.img} alt={project.title} className="rounded-lg mb-6" />
      <p className="text-lg">{project.description}</p>
    </div>
  );
}


// // 🔹 把資料移到外面，給 component + generateStaticParams 共用
// const projectData = {
//   "morphing-wood": {
//     title: "Morphing Wood",
//     description: "A humidity-responsive morphing wood prototype.",
//     img: "/images/p1.jpg",
//   },
//   "energy-retrofit": {
//     title: "Energy Retrofit",
//     description: "A study on sustainable building retrofits.",
//     img: "/images/p2.jpg",
//   },
//   "data-visualization": {
//     title: "Data Visualization",
//     description: "Interactive visualization of urban housing data.",
//     img: "/images/p3.jpg",
//   },
// };

// // 🔴 這個是重點：讓 Next 在 build 時知道有哪些 slug 要預先輸出
// export function generateStaticParams() {
//   return Object.keys(projectData).map((slug) => ({ slug }));
// }

// export default function ProjectDetail({ params }) {
//   const { slug } = params;
//   const project = projectData[slug];

//   if (!project) {
//     return <h1 className="p-8 max-w-3xl mx-auto text-2xl">Project Not Found</h1>;
//   }

//   return (
//     <div className="p-8 max-w-3xl mx-auto">
//       <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
//       <img src={project.img} alt={project.title} className="rounded-lg mb-6" />
//       <p className="text-lg">{project.description}</p>
//     </div>
//   );
// }

