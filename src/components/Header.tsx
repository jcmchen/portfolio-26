// "use client";

// import Link from "next/link";
// import { MouseEvent, useState, useEffect } from "react";
// import { usePathname, useRouter, useSearchParams } from "next/navigation";

// export default function Header() {
//   const [isOpen, setIsOpen] = useState(false);
//   const pathname = usePathname();
//   const router = useRouter();

//   const handleScroll = (e: MouseEvent<HTMLAnchorElement>) => {
//     e.preventDefault();

//     if (pathname !== "/") {
//       // 不在首頁 → 導向首頁並附帶查詢參數
//       router.push("/?scrollTo=projects");
//       setIsOpen(false);
//       return;
//     }

//     // 已在 home → 執行平滑滾動到 project section
//     const target = document.getElementById("projects-section");
//     if (!target) return;

//     const start = window.scrollY;
//     const end = target.getBoundingClientRect().top + window.scrollY - 80;
//     const distance = end - start;
//     const duration = 600;
//     let startTime: number | null = null;

//     const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

//     function scrollStep(timestamp: number) {
//       if (!startTime) startTime = timestamp;
//       const progress = Math.min((timestamp - startTime) / duration, 1);
//       const easedProgress = easeOutCubic(progress);
//       window.scrollTo(0, start + distance * easedProgress);
//       if (progress < 1) requestAnimationFrame(scrollStep);
//     }

//     requestAnimationFrame(scrollStep);
//     setIsOpen(false);
//   };

//   // 其他頁面也可以直接到 project section
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     if (searchParams.get("scrollTo") === "projects") {
//       const target = document.getElementById("projects-section");
//       if (target) {
//         // 延遲一點，確保 DOM 已經渲染好
//         setTimeout(() => {
//           target.scrollIntoView({ behavior: "smooth", block: "start" });
//         }, 200);
//       }
//     }
//   }, [searchParams]);

//   return (
//     <header className="bg-white/100 backdrop-blur shadow-sm sticky top-0 z-50 w-full">
//       <div className="w-full mx-auto px-8 py-4 md:px-10 md:py-6 flex items-center justify-between">
//         {/* Logo */}
//         <Link href="/" className="text-2xl text-black">
//           <span className="font-bold md:ml-16">Jeremy</span>{" "}
//           <span className="font-normal">CHEN</span>
//         </Link>

//         {/* 桌機版 Navigation */}
//         <nav className="text-black hidden md:flex space-x-4 text-lg md:space-x-10 md:mr-16">
//           <Link href="/" className="font-light hover:underline">
//             Home
//           </Link>
//           <a
//             href="/#projects-section"
//             onClick={handleScroll}
//             className="font-light hover:underline cursor-pointer"
//           >
//             Projects
//           </a>
//           <Link href="/gallery" className="font-light hover:underline">
//             Gallery
//           </Link>
//           <Link href="/about" className="font-light hover:underline">
//             About
//           </Link>
//         </nav>

//         {/* 手機版漢堡按鈕 */}
//         <button
//           className="md:hidden text-black focus:outline-none"
//           onClick={() => setIsOpen(!isOpen)}
//         >
//           <div className="w-6 h-0.5 bg-gray-800 mb-1"></div>
//           <div className="w-6 h-0.5 bg-gray-800 mb-1"></div>
//           <div className="w-6 h-0.5 bg-gray-800"></div>
//         </button>
//       </div>

//       {/* 手機版下拉選單 */}
//       {/* {isOpen && (
//         <div className="md:hidden bg-white/95 backdrop-blur shadow-lg px-8 py-4 space-y-4 text-lg">
//           <Link href="/" onClick={() => setIsOpen(false)} className="block font-light hover:underline">
//             Home
//           </Link>
//           <a
//             href="/#projects-section"
//             onClick={handleScroll}
//             className="block font-light hover:underline cursor-pointer"
//           >
//             Projects
//           </a>
//           <Link href="/gallery" onClick={() => setIsOpen(false)} className="block font-light hover:underline">
//             Gallery
//           </Link>
//           <Link href="/about" onClick={() => setIsOpen(false)} className="block font-light hover:underline">
//             About
//           </Link>
//         </div>
//       )} */}
//       {isOpen && (
//         // <div className="fixed inset-0 z-40 bg-white/100 backdrop-blur shadow-lg px-8 py-6 space-y-6 text-lg">
//         // <div className="fixed inset-0 z-40 bg-white flex flex-col items-center text-lg">
//         <div className="fixed inset-0 z-[999] bg-white/70 flex flex-col items-center justify-center px-8 py-40 space-y-4 text-lg">
//           <button
//             className="absolute top-4 right-6 text-gray-800 text-3xl"
//             onClick={() => setIsOpen(false)}
//           >
//             ✕
//           </button>

//           <Link href="/" onClick={() => setIsOpen(false)} className="block font-light">
//             Home
//           </Link>
//           <a
//             href="/#projects-section"
//             onClick={handleScroll}
//             className="block font-light hover:underline cursor-pointer"
//           >
//             Projects
//           </a>
//           <Link href="/gallery" onClick={() => setIsOpen(false)} className="block font-light">
//             Gallery
//           </Link>
//           <Link href="/about" onClick={() => setIsOpen(false)} className="block font-light">
//             About
//           </Link>
//         </div>
//       )}

//     </header>
//   );
// }

"use client";

import Link from "next/link";
import { MouseEvent, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  // 🔹 判斷是否當前路徑
  const isActive = (path: string) => pathname === path;
  // 處理點完 home 後點 projects 的 bug

  const handleScroll = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (pathname !== "/") {
      router.push("/?scrollTo=projects");
      setIsOpen(false);
      return;
    }

    // 同步更新 URL，避免 useEffect 覆蓋
    router.replace("/?scrollTo=projects", { scroll: false });

    const target = document.getElementById("projects-section");
    if (!target) return;

    const start = window.scrollY;
    const end = target.getBoundingClientRect().top + window.scrollY - 80;
    const distance = end - start;
    const duration = 600;
    let startTime: number | null = null;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    function scrollStep(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutCubic(progress);
      window.scrollTo(0, start + distance * easedProgress);
      if (progress < 1) requestAnimationFrame(scrollStep);
    }

    requestAnimationFrame(scrollStep);
    setIsOpen(false);
  };

  // useEffect(() => {
  //   const scrollTarget = searchParams.get("scrollTo");

  //   if (pathname !== "/") {
  //     window.scrollTo({ top: 0, behavior: "smooth" });
  //     setActiveSection(null);
  //   }

  //   if (scrollTarget === "projects") {
  //     setActiveSection("projects");
  //     const target = document.getElementById("projects-section");
  //     if (target) {
  //       setTimeout(() => {
  //         target.scrollIntoView({ behavior: "smooth", block: "start" });
  //       }, 200);
  //     }
  //   } else if (pathname !== "/") {
  //     // 只在非首頁時才清除 activeSection
  //     setActiveSection(null);
  //   } else if (!scrollTarget) {
  //     // 確保首頁但沒帶 scrollTo 時才回到 home
  //     setActiveSection("home");
  //   }
  // }, [searchParams, pathname]);

  useEffect(() => {
    const scrollTarget = searchParams.get("scrollTo");

    if (pathname !== "/") {
      // 🔹 非首頁 → 回到頂部
      window.scrollTo({ top: 0, behavior: "smooth" });
      return; // 直接結束，避免下面條件重複執行
    }

    if (scrollTarget === "projects") {
      // 🔹 首頁 + 帶 scrollTo=projects → 滾動到 Projects
      const target = document.getElementById("projects-section");
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      }
    }
  }, [searchParams, pathname]);

  return (
    // <header className="sticky top-0 z-50 w-full">
    //   <div className="w-full mx-auto px-8 py-4 md:px-10 md:py-6 flex items-center justify-between">
    //     {/* Logo */}
    //     <Link href="/" className="bg-white px-4 py-2 text-2xl text-black">
    //       <span className="font-bold bg-white">Jeremy</span>{" "}
    //       <span className="font-normal bg-white">CHEN</span>
    //     </Link>

    //     {/* 桌機版 Navigation */}
    //     <nav className="hidden md:flex space-x-4 text-lg md:space-x-6 md:mr-16">
    //       {[
    //         { name: "Home", href: "/" },
    //         { name: "Projects", href: "/#projects-section", scroll: true },
    //         { name: "Archive", href: "/archive" },
    //         { name: "About", href: "/about" },
    //       ].map((item, idx) => (
    //         <Link
    //           key={idx}
    //           href={item.href}
    //           className={`px-4 py-2 font-bold transition-colors duration-200
    //             ${
    //               pathname === item.href.split("?")[0]
    //                 ? "bg-black/90 text-white" // 🔹 當前頁 → 藍底白字
    //                 : "bg-white/90 text-black hover:bg-black hover:text-white"
    //             }`}              
    //         >
    //           {item.name}
    //         </Link>
    //       ))}
    //     </nav>
    //   </div>
    // </header>

    
    <header className="bg-white/30 backdrop-blur-sm sticky top-2 shadow-sm z-50 w-full"> {/*sticky top-0 */}
      <div className="w-full mx-auto px-8 py-4 md:px-10 md:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-3xl text-black">
          <span className="font-bold md:ml-16">Jeremy</span>{" "}
          <span className="font-normal">CHEN</span>
        </Link>

        {/* 桌機版 Navigation */}
        <nav className="text-black hidden md:flex space-x-4 text-lg md:space-x-10 md:mr-16">
          {/* <Link href="/" className="font-light hover:underline">
            Home
          </Link> */}
          <Link
            href="/"
            className={`font-light hover:underline ${
              isActive("/") && searchParams.get("scrollTo") !== "projects"
                ? "underline"
                : ""
            }`}
          >
            Home
          </Link>
          <Link
            href="/#projects-section"
            onClick={handleScroll}
            className={`font-light hover:underline cursor-pointer ${
              pathname === "/" && searchParams.get("scrollTo") === "projects"
                ? "underline"
                : ""
            }`}
          >
            Projects
          </Link>
          <Link
            href="/archive"
            className={`font-light hover:underline ${
              isActive("/archive") ? "underline" : ""
            }`}
          >
            Archive
          </Link>
          <Link
            href="/about"
            className={`font-light hover:underline ${
              isActive("/about") ? "underline" : ""
            }`}
          >
            About
          </Link>
        </nav>

        {/* 手機版漢堡/✕ */}
        <button
          className="md:hidden text-black focus:outline-none relative z-[1001] w-8 h-8"
          onClick={() => setIsOpen(!isOpen)}
        >
          <motion.span
            animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            className="absolute left-0 top-2 block h-0.5 w-8 bg-gray-800 rounded"
            transition={{ duration: 0.3 }}
          />
          <motion.span
            animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
            className="absolute left-0 top-4 block h-0.5 w-8 bg-gray-800 rounded top-3"
            transition={{ duration: 0.3 }}
          />
          <motion.span
            animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            className="absolute left-0 top-6 block h-0.5 w-8 bg-gray-800 rounded top-6"
            transition={{ duration: 0.3 }}
          />
        </button>
      </div>

      {/* 手機版下拉選單 Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[999] bg-white/95 flex flex-col items-center justify-center px-8 py-40 space-y-6 text-lg"
          >
            <Link href="/" onClick={() => setIsOpen(false)} className="block font-light hover:underline">
              Home
            </Link>
            <Link
              href="/#projects-section"
              onClick={handleScroll}
              className="block font-light hover:underline cursor-pointer"
            >
              Projects
            </Link>
            <Link href="/gallery" onClick={() => setIsOpen(false)} className="block font-light hover:underline">
              Gallery
            </Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className="block font-light hover:underline">
              About
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}





