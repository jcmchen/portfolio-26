import Image from "next/image";
import Link from "next/link";

const links = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/jeremy-chen-4b4356167/" },
  { label: "Medium", href: "https://medium.com/@jcmchen" },
  { label: "Berkeley Wood Lab", href: "https://www.berkeleywoodlab.com/" },
  { label: "Morphing Matter Lab", href: "https://morphingmatter.org/" },
];

const focusAreas = [
  "Architecture",
  "Human-computer interaction",
  "Robotic assembly",
  "Material systems",
  "Applied data science",
  "Ecological behavior",
];

export default function AboutPage() {
  return (
    <main className="bg-[#fbfaf7] px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-[1680px]">
        <section className="grid gap-8 border-b border-black pb-10 md:grid-cols-[1fr_0.52fr] md:gap-12">
          <div className="grid content-between gap-12">
            <div className="grid gap-4">
              <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                About
              </p>
              <h1 className="max-w-6xl text-[clamp(3.1rem,8vw,9.5rem)] font-light leading-[0.9] tracking-normal">
                Playing with the tangible and the intangible.
              </h1>
            </div>

            <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
              <div className="border-y border-black py-4 text-xs uppercase tracking-[0.14em] text-neutral-500">
                <p>Berkeley, CA, USA</p>
                <p className="mt-2">Taipei, Taiwan</p>
                <p className="mt-6 normal-case tracking-normal text-black">
                  jcmchen [at] berkeley [dot] edu
                </p>
              </div>

              <p className="text-lg leading-8 text-neutral-700">
                Jeremy Chen works across architecture, design, human-computer
                interaction, environmental policy, business, and mechanical
                engineering. His practice studies how data, computation, and
                material systems intersect in the built environment and beyond.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#e8e6df]">
              <Image
                src="/images/prof_pic.jpg"
                alt="Jeremy Chen"
                fill
                sizes="(max-width: 768px) 100vw, 38vw"
                className="object-cover grayscale-[20%]"
                priority
              />
            </div>
            <div className="grid grid-cols-2 border-t border-black pt-3 text-xs uppercase tracking-[0.12em] text-neutral-500">
              <span>Material</span>
              <span className="text-right">Perception</span>
            </div>
          </div>
        </section>

        <section className="grid gap-10 border-b border-black py-10 md:grid-cols-[0.45fr_1fr] md:py-14">
          <h2 className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Biography
          </h2>
          <div className="grid max-w-5xl gap-6 text-base leading-8 text-neutral-700 md:text-lg">
            <p>
              Jeremy holds a Master of{" "}
              <a
                href="https://ced.berkeley.edu/"
                target="_blank"
                rel="noreferrer"
                className="text-black underline underline-offset-4"
              >
                Architecture
              </a>{" "}
              from UC Berkeley, with Graduate Certificates in{" "}
              <a
                href="https://bcnm.berkeley.edu/"
                target="_blank"
                rel="noreferrer"
                className="text-black underline underline-offset-4"
              >
                New Media
              </a>
              ,{" "}
              <a
                href="https://www.ischool.berkeley.edu/programs/data-science-certificate"
                target="_blank"
                rel="noreferrer"
                className="text-black underline underline-offset-4"
              >
                Applied Data Science
              </a>
              , and{" "}
              <a
                href="https://ced.berkeley.edu/academics/degrees-certificates/certificates"
                target="_blank"
                rel="noreferrer"
                className="text-black underline underline-offset-4"
              >
                Geographic Information Science and Technology
              </a>
              .
            </p>

            <p>
              At the Morphing Matter Lab, he focuses on embedding digital
              information into the physical world, integrating emerging
              technologies with nature to create sustainable, responsive, and
              ecologically aware systems. His design philosophy is quantitative
              and qualitative in its approach, poetic and artistic in its
              expression, and innovative in its form.
            </p>

            <p>
              Prior to Berkeley, Jeremy earned his B.S. in{" "}
              <a
                href="https://www.ce.ntu.edu.tw/en/home/"
                target="_blank"
                rel="noreferrer"
                className="text-black underline underline-offset-4"
              >
                Civil Engineering
              </a>{" "}
              from National Taiwan University, specializing in architectural
              engineering, computer-aided engineering, and tectonics.
            </p>
          </div>
        </section>

        <section className="grid gap-10 py-10 md:grid-cols-[0.45fr_1fr] md:py-14">
          <h2 className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Index
          </h2>
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="border-b border-black pb-3 text-xs uppercase tracking-[0.14em]">
                Focus
              </h3>
              <div className="grid">
                {focusAreas.map((area) => (
                  <div
                    key={area}
                    className="grid grid-cols-[1fr_auto] border-b border-neutral-300 py-3 text-sm"
                  >
                    <span>{area}</span>
                    <span className="text-neutral-400">+</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="border-b border-black pb-3 text-xs uppercase tracking-[0.14em]">
                Links
              </h3>
              <div className="grid">
                {links.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    className="grid grid-cols-[1fr_auto] border-b border-neutral-300 py-3 text-sm hover:underline"
                  >
                    <span>{item.label}</span>
                    <span>Open</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
