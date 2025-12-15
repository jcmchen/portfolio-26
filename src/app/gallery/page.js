import ProjectCard from "@/components/ProjectCard";

const projects = [
  { id: 1, slug: "morphing-wood", title: "Morphing Wood", img: "/images/image12.png" },
  { id: 2, slug: "energy-retrofit", title: "Energy Retrofit", img: "/images/image13.png" },
  { id: 3, slug: "data-visualization", title: "Data Visualization", img: "/images/image14.png" },
];

export default function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-6">My Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}
