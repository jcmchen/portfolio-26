"use client";

import Image from "next/image";
import Link from "next/link";
import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({ subsets: ["latin"], weight: ["600", "600"] });

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row-reverse items-start gap-8">
        {/* Profile Section: 照片 + 聯絡方式 */}
        <div className="w-full md:w-1/3 flex flex-col items-start">
          <br></br>
          <br></br>
          <Image
            src="/images/prof_pic.jpg"
            alt="Profile picture"
            width={300}
            height={300}
            className="object-cover shadow-lg mb-6"
          />

          {/* Contact Info under photo */}
          <div className="text-left">
            <br></br>
            <p>Berkeley, CA, USA</p>
            <p>Taipei, Taiwan</p>
            

            <div className="mt-8 flex flex-col">
              <Link
                href="https://www.linkedin.com/in/jeremy-chen-4b4356167/"
                target="_blank"
                className="hover:underline"
              >
                LinkedIn
              </Link>
              <Link
                href="https://medium.com/@jcmchen"
                target="_blank"
                className="hover:underline"
              >
                Medium
              </Link>
              <p className="mt-2">jcmchen [at] berkeley [dot] edu</p>
            </div>
          </div>
        </div>

        {/* Text Info */}
        <div className="w-full md:w-2/3 text-left">
          <br></br>
          <br></br>
          <h1 className="text-2xl font-light mb-4">
            Playing with 
            the tangible and the intangible,
            <br></br>
            the visible and the invisible.
          </h1>
          {/* <h2 className="text-lg text-gray-700 mb-6">
            Master of Architecture Student at{" "}
            <Link
              href="https://ced.berkeley.edu/"
              target="_blank"
              className="text-[rgb(50,116,216)] hover:underline"
            >
              UC Berkeley CED
            </Link>
          </h2> */}

          <br></br>

          <p className="font-light mb-4">
            Jeremy Chen holds a Master of {" "}
            <a
              href="https://ced.berkeley.edu/"
              target="_blank"
              rel="noreferrer"
              // className="no-underline transition hover:underline"
              className={`${openSans.className} no-underline transition hover:underline`}
            >
              Architecture
            </a> from UC Berkeley, with Graduate Certificates in{" "}
            <a
              href="https://bcnm.berkeley.edu/"
              target="_blank"
              rel="noreferrer"
              // className="no-underline transition hover:underline"
              className={`${openSans.className} no-underline transition hover:underline`}
            >
              New Media
            </a>
            , {" "}
            <a
              href="https://www.ischool.berkeley.edu/programs/data-science-certificate"
              target="_blank"
              rel="noreferrer"
              // className="no-underline transition hover:underline"
              className={`${openSans.className} no-underline transition hover:underline`}
            >
              Applied Data Science
            </a>
            , and {" "}
            <a
              href="https://ced.berkeley.edu/academics/degrees-certificates/certificates"
              target="_blank"
              rel="noreferrer"
              // className="no-underline transition hover:underline"
              className={`${openSans.className} no-underline transition hover:underline`}
            >
              Geographic Information Science and Technology
            </a>
            . His work spans architecture, 
            design, and human-computer interaction, as well as environmental policy, business, and mechanical engineering,
            exploring how data, computation, and material systems intersect in the built environment and beyond.
            He works with the{" "}
            <a
              href="https://www.berkeleywoodlab.com/"
              target="_blank"
              rel="noreferrer"
              // className="no-underline transition hover:underline"
              className={`${openSans.className} no-underline transition hover:underline`}
            >
              Berkeley Wood Lab
            </a>
            , the Haas School of Business, and the{" "}
            <a
              href="https://morphingmatter.org/"
              target="_blank"
              rel="noreferrer"
              // className="no-underline transition hover:underline"
              className={`${openSans.className} no-underline transition hover:underline`}
            >
              Morphing Matter Lab
            </a>
            .
            At the Morphing Matter Lab, he focuses on embedding digital information into the physical world, 
            integrating emerging technologies with nature to create sustainable, responsive, and ecologically aware systems.
          </p>

          <p className="font-light mb-4">
            His design philosophy is {" "}
            <span className={openSans.className}>“quantitative and qualitative in its approach, poetic and artistic in its expression,
            and innovative in its form,”</span> reflecting a balance between analytical rigor and creative exploration. 
            He believes data-informed decision-making opens up new possibilities for better design and is equally committed 
            to crafting immersive, perceptually rich experiences that engage and augment all senses.
          </p>

          <p className="font-light mb-4">
            Prior to Berkeley, Jeremy earned his B.S. in {""}
            <a
              href="https://www.ce.ntu.edu.tw/en/home/"
              target="_blank"
              rel="noreferrer"
              // className="no-underline transition hover:underline"
              className={`${openSans.className} no-underline transition hover:underline`}
            >
              Civil Engineering
            </a> from National Taiwan University, specializing 
            in architectural engineering, computer-aided engineering, and tectonics.
          </p>

        </div>
      </div>
    </div>
  );
}
