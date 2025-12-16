import Image from "next/image";
import Link from "next/link";

type Project = {
  slug: string;
  title: string;
  year: string | number;
  category: string;
  img: string;
};

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="block w-full group">
      <div className="flex flex-col w-full">
        <div className="overflow-hidden mb-2">
          <Image
            src={project.img}
            alt={project.title}
            width={600}
            height={400}
            className="object-contain w-full h-auto transition duration-300 ease-out group-hover:scale-[1.08]"
          />
        </div>
        <h3 className="text-base hover:underline">
          {project.title} — {project.year}
        </h3>
      </div>
    </Link>
  );
}
