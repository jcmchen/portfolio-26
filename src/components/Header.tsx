"use client";

import Link from "next/link";
import { MouseEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Projects", href: "/#projects-section", scroll: true },
  { name: "Gallery", href: "/gallery" },
  { name: "About", href: "/about" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const scrollToProjectsSection = (behavior: ScrollBehavior = "smooth") => {
    const target = document.getElementById("projects-section");
    if (!target) return;

    const header = document.querySelector("header");
    const headerHeight = header?.offsetHeight ?? 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;

    window.scrollTo({ top, behavior });
  };

  const scrollToHome = (behavior: ScrollBehavior = "smooth") => {
    window.scrollTo({ top: 0, behavior });
  };

  const handleProjectScroll = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsOpen(false);

    if (pathname !== "/") {
      router.push("/?scrollTo=projects");
      return;
    }

    router.replace("/?scrollTo=projects", { scroll: false });
    window.setTimeout(() => scrollToProjectsSection("smooth"), 0);
  };

  const handleHomeScroll = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsOpen(false);

    if (pathname !== "/" || searchParams.has("scrollTo")) {
      router.push("/", { scroll: false });
      window.setTimeout(() => scrollToHome("smooth"), 150);
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (pathname !== "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (searchParams.get("scrollTo") === "projects") {
      window.setTimeout(() => {
        scrollToProjectsSection("smooth");
      }, 200);
      return;
    }

    window.setTimeout(() => scrollToHome("auto"), 0);
  }, [pathname, searchParams]);

  const isCurrent = (href: string, scroll?: boolean) => {
    if (scroll) return pathname === "/" && searchParams.get("scrollTo") === "projects";
    if (href === "/") return pathname === "/" && searchParams.get("scrollTo") !== "projects";
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black bg-[#fbfaf7]/95">
      <div className="mx-auto grid max-w-[1680px] grid-cols-[1fr_auto] items-center px-4 py-3 md:grid-cols-[1fr_auto_1fr] md:px-8">
        <Link href="/" className="text-lg font-normal uppercase tracking-[0.18em] md:text-xl">
          Jeremy Chen
        </Link>

        <div className="hidden text-center text-[10px] uppercase tracking-[0.22em] text-neutral-400 md:block">
          Matter / Computation / Perception
        </div>

        <nav className="hidden justify-self-end md:flex md:items-center md:gap-7">
          {navItems.map((item) => {
            const active = isCurrent(item.href, item.scroll);
            const className = `text-[13px] font-normal uppercase tracking-[0.14em] transition ${
              active
                ? "text-black underline underline-offset-4"
                : "text-neutral-400 hover:text-black"
            }`;

            if (item.scroll) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleProjectScroll}
                  className={className}
                >
                  {item.name}
                </Link>
              );
            }

            if (item.href === "/") {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleHomeScroll}
                  className={className}
                >
                  {item.name}
                </Link>
              );
            }

            return (
              <Link key={item.name} href={item.href} className={className}>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="relative z-[1001] grid h-9 w-9 place-items-center border border-black md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="sr-only">Menu</span>
          <span className="relative block h-4 w-5">
            <motion.span
              animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              className="absolute left-0 top-0 h-px w-5 bg-black"
            />
            <motion.span
              animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
              className="absolute left-0 top-2 h-px w-5 bg-black"
            />
            <motion.span
              animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              className="absolute left-0 top-4 h-px w-5 bg-black"
            />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999] grid place-items-center border-t border-black bg-[#fbfaf7] px-6 md:hidden"
          >
            <div className="grid w-full gap-5 text-center">
              {navItems.map((item) =>
                item.scroll ? (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleProjectScroll}
                    className="border-b border-black pb-4 text-3xl uppercase tracking-[0.12em]"
                  >
                    {item.name}
                  </Link>
                ) : item.href === "/" ? (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleHomeScroll}
                    className="border-b border-black pb-4 text-3xl uppercase tracking-[0.12em]"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="border-b border-black pb-4 text-3xl uppercase tracking-[0.12em]"
                  >
                    {item.name}
                  </Link>
                )
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
