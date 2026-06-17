import Image from "next/image";
import Link from "next/link";

type Project = {
  slug: string;
  title: string;
  year: string | number;
  category: string;
  img: string;
};

type ProjectCardProps = {
  project: Project;
  muted?: boolean;
  priority?: boolean;
  sizes?: string;
};

export default function ProjectCard({
  project,
  muted = false,
  priority = false,
  sizes = "(min-width: 1536px) 13vw, (min-width: 1024px) 20vw, 78vw",
}: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      aria-label={`${project.title}, ${project.year}`}
      className="project-card group block w-full"
    >
      <div className="w-full">
        <div
          className={`relative aspect-[3/2] overflow-hidden border border-black bg-[#ebe8df] transition duration-300 ease-out ${
            muted
              ? "opacity-25 grayscale contrast-75 group-hover:opacity-75 group-hover:grayscale-0 group-hover:contrast-100"
              : "opacity-100 grayscale-0"
          }`}
        >
          <Image
            src={project.img}
            alt={project.title}
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover transition duration-500 ease-out group-hover:scale-[1.025]"
          />
        </div>
        <div
          className={`mt-2 border-b pb-2 transition-colors ${
            muted ? "border-neutral-200 text-neutral-400" : "border-neutral-300 text-black"
          }`}
        >
          <h3 className="text-[13px] font-normal uppercase leading-[1.25] tracking-normal group-hover:underline">
            {project.title}
          </h3>
          <p className="mt-1 text-[10px] font-normal uppercase tracking-[0.14em] text-neutral-500">
            {project.year}
          </p>
        </div>
      </div>
    </Link>
  );
}
