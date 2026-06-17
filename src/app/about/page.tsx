import Image from "next/image";
import Link from "next/link";

const contactLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/jeremy-chen-4b4356167/" },
  { label: "Medium", href: "https://medium.com/@jcmchen" },
  { label: "jcmchen [at] berkeley [dot] edu", href: "mailto:jcmchen@berkeley.edu" },
];

const textLinkClass =
  "font-bold text-black transition hover:underline hover:decoration-[0.5px] hover:underline-offset-2";

export default function AboutPage() {
  return (
    <main className="bg-[#fbfaf7] px-4 py-10 md:px-8 md:py-14">
      <section className="mx-auto grid max-w-[1120px] gap-10 pb-12 pt-2 md:pt-6 lg:grid-cols-[minmax(0,640px)_minmax(300px,360px)] lg:gap-16">
        <article className="grid max-w-[640px] content-start gap-10">
          <div>
            <p className="text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-500">
              About
            </p>
            <h1
              className="mt-8 max-w-[600px] text-[26px] leading-[1.22] tracking-normal text-neutral-800 md:text-[32px]"
              style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif', fontWeight: 300 }}
            >
              <span className="block md:whitespace-nowrap">
                Playing with the tangible and the intangible,
              </span>
              <span className="block md:whitespace-nowrap">
                the visible and the invisible.
              </span>
            </h1>
          </div>

          <div className="grid max-w-[620px] gap-6 text-[15px] font-normal leading-7 text-neutral-700">
            <p>
              Jeremy Chen holds a Master of{" "}
              <a
                href="https://ced.berkeley.edu/"
                target="_blank"
                rel="noreferrer"
                className={textLinkClass}
              >
                Architecture
              </a>{" "}
              from UC Berkeley, with Graduate Certificates in{" "}
              <a
                href="https://bcnm.berkeley.edu/"
                target="_blank"
                rel="noreferrer"
                className={textLinkClass}
              >
                New Media
              </a>
              ,{" "}
              <a
                href="https://www.ischool.berkeley.edu/programs/data-science-certificate"
                target="_blank"
                rel="noreferrer"
                className={textLinkClass}
              >
                Applied Data Science
              </a>
              , and{" "}
              <a
                href="https://ced.berkeley.edu/academics/degrees-certificates/certificates"
                target="_blank"
                rel="noreferrer"
                className={textLinkClass}
              >
                Geographic Information Science and Technology
              </a>
              . His work spans architecture, design, and human-computer
              interaction, as well as environmental policy, business, and
              mechanical engineering, exploring how data, computation, and
              material systems intersect in the built environment and beyond.
              He works with the{" "}
              <a
                href="https://www.berkeleywoodlab.com/"
                target="_blank"
                rel="noreferrer"
                className={textLinkClass}
              >
                Berkeley Wood Lab
              </a>
              , the Haas School of Business, and the{" "}
              <a
                href="https://morphingmatter.org/"
                target="_blank"
                rel="noreferrer"
                className={textLinkClass}
              >
                Morphing Matter Lab
              </a>
              . At the Morphing Matter Lab, he focuses on embedding digital
              information into the physical world, integrating emerging
              technologies with nature to create sustainable, responsive, and
              ecologically aware systems.
            </p>

            <p>
              His design philosophy is{" "}
              <strong className="font-bold text-black">
                quantitative and qualitative in its approach, poetic and
                artistic in its expression, and innovative in its form
              </strong>
              , reflecting a balance between analytical rigor and creative
              exploration. He believes data-informed decision-making opens up
              new possibilities for better design and is equally committed to
              crafting immersive, perceptually rich experiences that engage and
              augment all senses.
            </p>

            <p>
              Prior to Berkeley, Jeremy earned his B.S. in{" "}
              <a
                href="https://www.ce.ntu.edu.tw/en/home/"
                target="_blank"
                rel="noreferrer"
                className={textLinkClass}
              >
                Civil Engineering
              </a>{" "}
              from National Taiwan University, specializing in architectural
              engineering, computer-aided engineering, and tectonics.
            </p>
          </div>
        </article>

        <aside className="grid content-start gap-8">
          <div className="group relative aspect-square max-w-[360px] overflow-hidden bg-[#e8e6df] shadow-[0_14px_28px_rgba(17,17,17,0.08)]">
            <Image
              src="/images/prof_pic.jpg"
              alt="Jeremy Chen in a snowy landscape"
              fill
              sizes="(max-width: 768px) 92vw, 420px"
              className="object-cover transition duration-500 ease-out group-hover:scale-[1.025] group-hover:contrast-110"
              priority
            />
          </div>

          <div className="grid max-w-[360px] gap-7">
            <div className="text-[11px] font-normal uppercase leading-5 tracking-[0.14em] text-neutral-600">
              <p>Berkeley, CA, USA</p>
              <p className="mt-1">Taipei, Taiwan</p>
            </div>

            <div className="grid gap-2">
              {contactLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={item.href.startsWith("mailto:") ? undefined : "noreferrer"}
                  className="w-fit text-[11px] font-normal uppercase tracking-[0.14em] text-black transition hover:underline hover:underline-offset-4"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
