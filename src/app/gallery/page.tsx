"use client";

import Image from "next/image";

const galleryItems = [
  { title: "Hengyang Rd", meta: "Taipei · 2018", src: "/images/000018190022.jpg" },
  { title: "Eye Filmmuseum", meta: "Amsterdam · 2020", src: "/images/photo/000282880027.jpg" },
  { title: "Switzerland", meta: "Switzerland · 2020", src: "/images/photo/003746610032.jpg" },
  // { title: "Nürnberg", meta: "Germany· 2020", src: "/images/photo/2AEF341F-CD87-4A7F-9871-7294E793BB41.JPG" },
  { title: "Council of Ministers Building", meta: "Sophia · 2020", src: "/images/photo/000282880032.jpg" },

  { title: "The Presidency", meta: "Sophia · 2020", src: "/images/photo/000282880033 2.JPG" },

  { title: "Switzerland", meta: "Switzerland · 2020", src: "/images/photo/003746620007.jpg" },
  // { title: "Switzerland", meta: "Switzerland · 2020", src: "/images/photo/2AEF341F-CD87-4A7F-9871-7294E793BB41.JPG" },

  // { title: "Sacred Light", meta: "Perception · 2020", src: "/images/IMG_5087_BW-c.jpg" },
  // { title: "Yuan", meta: "Interactive · 2023", src: "/images/portfolio/p_Page_38.png" },
  // { title: "Illustrations", meta: "Sketch · 2019", src: "/images/DSC_8999-PS3_BW-c.jpg" },
  // { title: "Granola Cuckoo Clock", meta: "TUI · 2022", src: "/images/TUI/DSC_6529_ED.jpg" },
  // { title: "Moment Cube", meta: "TUI · 2022", src: "/images/moment-cube/ezgif.com-gif-maker.gif" },
];

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-3">Gallery</p>
          <h1 className="text-4xl md:text-5xl font-light text-gray-900">The visible and the invisible.</h1>
          <p className="text-gray-600 mt-4 max-w-3xl">
            Places and scenes across the world.
          </p>
        </header>

        <div className="columns-1 sm:columns-2 lg:columns-2 gap-8 [column-fill:_balance]">
          {galleryItems.map((item, idx) => (
            <figure key={idx} className="mb-6 break-inside-avoid overflow-hidden bg-gray-50 shadow-sm transition-shadow duration-300 ease-out hover:shadow-lg">
              <div className="relative w-full overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.title}
                  width={1200}
                  height={800}
                  className="w-full h-auto object-cover transition duration-500 ease-out"
                  unoptimized={item.src.endsWith(".gif")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 hover:opacity-100 transition duration-300" />
                <figcaption className="absolute inset-x-0 bottom-0 p-4 text-white opacity-0 hover:opacity-100 transition duration-300">
                  <div className="text-lg font-medium">{item.title}</div>
                  <div className="text-sm text-gray-200">{item.meta}</div>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
