"use client";

import Link from "next/link";
import { MouseEvent, useEffect, useRef, useState } from "react";
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      mobileMenuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    });
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

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
      if (pathname === "/") {
        window.setTimeout(
          () => window.dispatchEvent(new Event("portfolio:home-enter")),
          320
        );
      }
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    window.dispatchEvent(new Event("portfolio:home-enter"));
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
    <header className="sticky top-0 z-50 border-b border-black bg-[#fbfaf7]">
      <div className="mx-auto grid max-w-[1680px] grid-cols-[1fr_auto] items-center px-4 py-2 md:grid-cols-[1fr_auto_1fr] md:px-8 md:py-3">
        <Link
          href="/"
          onClick={handleHomeScroll}
          className="text-lg font-normal uppercase tracking-[0.18em] md:text-xl"
        >
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
          ref={menuButtonRef}
          type="button"
          className="relative z-[1001] grid h-11 w-11 place-items-center border border-black md:hidden"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="sr-only">Menu</span>
          <span className="relative block h-4 w-5">
            <motion.span
              animate={isOpen ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 top-0.5 h-px w-5 origin-center bg-black"
            />
            <motion.span
              animate={isOpen ? { opacity: 0, scaleX: 0.4 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute left-0 top-[7.5px] h-px w-5 origin-center bg-black"
            />
            <motion.span
              animate={isOpen ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 top-[13px] h-px w-5 origin-center bg-black"
            />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-0 top-[61px] z-[999] bg-black/20 md:hidden"
            onClick={() => {
              setIsOpen(false);
              window.requestAnimationFrame(() => menuButtonRef.current?.focus());
            }}
          >
            <motion.nav
              ref={mobileMenuRef}
              id="mobile-navigation"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-3 top-3 max-h-[calc(100svh-85px)] w-[calc(100%_-_24px)] max-w-[360px] overflow-y-auto border border-black bg-[#fbfaf7] px-4 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.16)]"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key !== "Tab") return;

                const links = Array.from(
                  event.currentTarget.querySelectorAll<HTMLAnchorElement>("a")
                );
                const firstLink = links[0];
                const lastLink = links.at(-1);

                if (!firstLink || !lastLink) return;
                if (event.shiftKey && document.activeElement === firstLink) {
                  event.preventDefault();
                  lastLink.focus();
                } else if (!event.shiftKey && document.activeElement === lastLink) {
                  event.preventDefault();
                  firstLink.focus();
                }
              }}
            >
              <div className="grid">
                {navItems.map((item) =>
                  item.scroll ? (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={handleProjectScroll}
                      className={`min-h-14 border-b border-black py-4 text-[22px] uppercase leading-none tracking-[0.12em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black ${
                        isCurrent(item.href, item.scroll) ? "text-black" : "text-neutral-600"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ) : item.href === "/" ? (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={handleHomeScroll}
                      className={`min-h-14 border-b border-black py-4 text-[22px] uppercase leading-none tracking-[0.12em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black ${
                        isCurrent(item.href) ? "text-black" : "text-neutral-600"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`min-h-14 border-b border-black py-4 text-[22px] uppercase leading-none tracking-[0.12em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black ${
                        isCurrent(item.href) ? "text-black" : "text-neutral-600"
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
