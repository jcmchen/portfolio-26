// "use client";

// import { Swiper, SwiperSlide } from "swiper/react";
// import { Navigation, Pagination, Autoplay } from "swiper/modules";
// import Image from "next/image";
// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";
// import "swiper/css/effect-fade";

// const slides = [
//   {
//     img: "/images/MomentCube/ezgif.com-gif-maker.gif",
//     title: "MomentCube",
//     links: [
//       { text: "Project Page", href: "#" },
//       { text: "Paper", href: "#" },
//     ],
//   },
//   {
//     img: "/images/images13.png",
//     title: "Energy Retrofit Project",
//     links: [
//       { text: "Paper", href: "#" },
//       { text: "Project Page", href: "#" },
//     ],
//   },
//   {
//     img: "/images/images14.png",
//     title: "Data Visualization Study",
//     links: [
//       { text: "Journal", href: "#" },
//       { text: "Project Page", href: "#" },
//     ],
//   },
// ];

// export default function HeroSlider() {
//   return (
//     <div className="w-full h-[80vh] relative">
//       <Swiper
//         modules={[Navigation, Pagination, Autoplay]}
//         navigation
//         pagination={{ clickable: true }}
//         autoplay={{ delay: 8000, disableOnInteraction: false }}
//         speed={1100}           // 轉場速度 (毫秒)
//         loop
//         className="h-full"
//       >
//         {slides.map((slide, idx) => (
//           <SwiperSlide key={idx}>
//             <div className="relative w-full h-full">
//               <Image
//                 src={slide.img}
//                 alt={slide.title}
//                 fill
//                 priority
//                 className="object-cover"
//               />
//               <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white text-center px-6">
//                 <h2 className="text-2xl md:text-3xl font-semibold mb-3">{slide.title}</h2>
//                 <div className="space-x-4">
//                   {slide.links.map((link, i) => (
//                     <a
//                       key={i}
//                       href={link.href}
//                       className="underline hover:text-blue-300"
//                     >
//                       {link.text}
//                     </a>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </SwiperSlide>
//         ))}
//       </Swiper>
//     </div>
//   );
// }






"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import Image from "next/image";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

const slides = [
  {
    img: "/images/moment-cube/ezgif.com-gif-maker.gif",
    title: "MomentCube",
    links: [
      { text: "Project Page", href: "#" },
      { text: "Paper", href: "#" },
    ],
  },
  {
    img: "/images/moment-cube/cube_compressed2.gif",
    title: "MomentCube",
    links: [
      { text: "Project Page", href: "#" },
      { text: "Paper", href: "#" },
    ],
  },
  {
    img: "/images/seed/DSC_7539_bright_02-c3.jpg",
    title: "Seeds Starter Kit",
    links: [
      { text: "Project Page", href: "#" },
    ],
  },
  {
    img: "/images/IMG_0003-ed.jpg",
    title: "Unidentified Funicular Object",
    links: [
      { text: "Paper", href: "#" },
      { text: "Project Page", href: "#" },
    ],
  },
  {
    img: "/images/DSC_9959_ed.jpg",
    title: "Form Force Matter",
    links: [
      { text: "Journal", href: "#" },
      { text: "Project Page", href: "#" },
    ],
  },
  {
    img: "/images/DSC_9100-c.jpg",
    title: "Micro Macro",
    links: [
      { text: "Project Page", href: "#" },
    ],
  },
  {
    img: "/images/IMG_1259-ed.jpg",
    title: "Interlace",
    links: [
      { text: "Project Page", href: "#" },
    ],
  },
  {
    img: "/images/CNV000021-ed.jpg",
    title: "Bridges",
    links: [
      { text: "Project Page", href: "#" },
    ],
  },
  {
    img: "/images/IMG_5087_BW-c.jpg",
    title: "Sacred Light",
    links: [
      { text: "Project Page", href: "#" },
      { text: "Paper", href: "#" },
    ],
  },
  {
    img: "/images/DSC_7022-c.jpg",
    title: "Assembled Living",
    links: [
      { text: "Project Page", href: "#" },
    ],
  },
  {
    img: "/images/BICM-00.png",
    title: "Bio-inspired Composites Design",
    links: [
      { text: "Project Page", href: "#" },
    ],
  },
  {
    img: "/images/DSC_8958-c.jpg",
    title: "Botani Plan: Second Nature",
    links: [
      { text: "Project Page", href: "#" },
    ],
  },
  {
    img: "/images/Tree 01-c.jpeg",
    title: "The Nature of Growth",
    links: [
      { text: "Project Page", href: "#" },
    ],
  }
];

export default function HeroSlider() {
  return (
    <div className="w-full h-[92vh] relative -mt-3">
      <Swiper
        modules={[Autoplay, EffectFade, Navigation, Pagination]}
        effect="fade"                  // ✅ 使用淡入淡出
        fadeEffect={{ crossFade: true }}   // ✅ 加這個
        speed={400}                   // ✅ 過場速度
        autoplay={{ delay: 5500, disableOnInteraction: false }}
        navigation                         // ✅ 左右箭頭
        pagination={{ clickable: true }}   // ✅ 分頁點
        loop                           // ✅ 無限循環
        className="h-full"
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={idx}>
            <div className="relative w-full h-full">
              <Image
                src={slide.img}
                alt={slide.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white text-center px-6">
                <h2 className="text-2xl md:text-3xl font-light mb-1">{slide.title}</h2>
                {/* <div className="space-x-4"> */}
                <div className="flex flex-wrap justify-center gap-4 text-[1.1rem] font-extralight">
                  {slide.links.map((link, i) => (
                    <a
                      key={i}
                      href={link.href}
                      className="underline font-light hover:text-[rgb(50,116,216)]"
                    >
                      {link.text}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
