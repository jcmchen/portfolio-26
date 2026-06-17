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
    <main className="min-h-screen bg-[#fbfaf7]">
      <section className="mx-auto max-w-[1120px] px-4 py-14 md:px-8 md:py-16">
        <header className="mb-12">
          <p className="mb-3 text-[13px] font-normal uppercase tracking-[0.28em] text-neutral-500">
            Gallery
          </p>
          <h1
            className="text-[38px] leading-tight tracking-normal text-neutral-800 md:text-[50px]"
            style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif', fontWeight: 300 }}
          >
            The visible and the invisible.
          </h1>
          <p className="mt-4 max-w-3xl text-[16px] font-normal leading-6 text-neutral-600">
            Places and scenes across the world.
          </p>
        </header>

        <div className="columns-1 gap-8 [column-fill:_balance] sm:columns-2">
          {galleryItems.map((item, idx) => (
            <figure
              key={idx}
              className="group mb-8 break-inside-avoid overflow-hidden bg-[#ebe8df] shadow-[0_2px_12px_rgba(17,17,17,0.12)]"
            >
              <div className="relative w-full overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.title}
                  width={1200}
                  height={800}
                  className="h-auto w-full object-cover transition duration-500 ease-out group-hover:scale-[1.012]"
                  unoptimized={item.src.endsWith(".gif")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                <figcaption className="absolute inset-x-0 bottom-0 p-4 text-white opacity-0 transition duration-300 group-hover:opacity-100">
                  <div className="text-[13px] font-normal uppercase leading-[1.25] tracking-normal">
                    {item.title}
                  </div>
                  <div className="mt-1 text-[10px] font-normal uppercase tracking-[0.14em] text-white/80">
                    {item.meta}
                  </div>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
