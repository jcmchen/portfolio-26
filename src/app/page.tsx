"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type UIEvent,
} from "react";
import FilterBar from "@/components/FilterBar";
import ProjectCard from "@/components/ProjectCard";

type Project = {
  slug: string;
  title: string;
  year: string | number;
  category: string;
  img: string;
  label?: string;
};

type ProjectLink = {
  text: string;
  href: string;
};

type HighlightProject = Project & {
  links: ProjectLink[];
};

type FieldNote = {
  id: string;
  region: "Taiwan" | "SF Bay Area";
  coordinates: string;
  place: string;
  prompt: string;
  source: string;
  imageUrl?: string;
  imageAlt?: string;
  url?: string;
};

const projects: Project[] = [
  {
    slug: "hygrometric",
    title: "Hygrometric",
    year: 2026,
    category: "Nature",
    img: "/images/hygrometric/cover_long.jpg",
    label: "Computational framework for hygromorphic shape-morphing.",
  },
  { slug: "micro-macro", title: "Micro Macro", year: "2019-2020", category: "Perception", img: "/images/DSC_9100-c.jpg", label: "Scale shifts, perception, and spatial ambiguity." },
  { slug: "bridges", title: "Bridges", year: "2017-2018", category: "Construction / Fabrication", img: "/images/CNV000021-ed.jpg" },
  { slug: "form-force-matter", title: "Form Force Matter", year: 2021, category: "Construction / Fabrication", img: "/images/DSC_9959_ed.jpg" },
  { slug: "resource-rush", title: "Resource Rush", year: 2023, category: "Robotics", img: "/images/resource-main.png" },
  { slug: "hanger-games", title: "Hanger Games", year: 2019, category: "Construction / Fabrication", img: "/images/sss19-00-ps-ai-bg.png" },
  { slug: "slime-spring-structure", title: "Slime Spring Structure", year: 2018, category: "Construction / Fabrication", img: "/images/sss18-01-c-ai-bg.png" },
  { slug: "interlace", title: "Interlace", year: 2018, category: "Construction / Fabrication", img: "/images/IMG_1259-ed.jpg" },
  { slug: "bridge-x", title: "Bridge X", year: 2021, category: "Construction / Fabrication", img: "/images/bridge-x_300ppi.png" },
  { slug: "fold-and-cut", title: "Fold & Cut", year: 2017, category: "Perception", img: "/images/DSC_3370-ed.jpg" },
  { slug: "illustrations", title: "Illustrations", year: "2019-2021", category: "Perception", img: "/images/DSC_8999-PS3_BW-c.jpg" },
  { slug: "sacred-light", title: "Sacred Light", year: 2020, category: "Perception", img: "/images/IMG_5087_BW-c.jpg" },
  { slug: "unidentified-funicular-objects", title: "Unidentified Funicular Objects", year: "2017", category: "Construction / Fabrication", img: "/images/IMG_0003-ed.jpg" },
  { slug: "moment-cube", title: "MomentCube", year: 2022, category: "New Media", img: "/images/moment-cube/DSC08012_REDUCED.jpg" },
  { slug: "yuan", title: "Yuan", year: 2023, category: "Perception", img: "/images/portfolio/p_Page_38.png" },
  { slug: "task-and-motion-planning", title: "Task and Motion Planning for Robotic Assembly", year: 2023, category: "Robotics", img: "/images/chair/0160.png" },
  { slug: "the-nature-of-growth", title: "The Nature of Growth", year: 2019, category: "Nature", img: "/images/Tree%2001-c.jpeg" },
  { slug: "mobility-and-housing-taipei", title: "Mobility and Housing in Taipei", year: 2024, category: "Visualization", img: "/images/housing01.png" },
  { slug: "bio-inspired-composite", title: "Bio-Inspired Composite Materials", year: 2019, category: "Nature", img: "/images/BICM-00.png" },
  { slug: "botani-plan", title: "Botani Plan: Second Nature", year: 2020, category: "Nature", img: "/images/DSC_8958-c.jpg" },
  { slug: "floating-structures", title: "Floating Structures", year: "2019-2020", category: "Nature", img: "/images/IMG_8809-c2.png" },
  { slug: "tangi-growth", title: "TangiGrowth", year: 2022, category: "New Media", img: "/images/TUI/Tangi05-ed.jpg" },
  { slug: "our-grandmas-fridge", title: "Our Grandma's Fridge", year: 2023, category: "New Media", img: "/images/fridge/ogf_mol_2024.png" },
  { slug: "capacitive-salad", title: "Capacitive Salad", year: 2022, category: "New Media", img: "/images/TUI/salad-ed.png" },
  { slug: "seeds-starter-kit", title: "Seeds Starter Kit", year: 2023, category: "Nature", img: "/images/Seed/DSC_7539_bright_02-c3.jpeg" },
  { slug: "computer-graphics-imaging", title: "Computer Graphics and Imaging", year: 2024, category: "Visualization", img: "/images/cg/cg02.png" },
  { slug: "recycled-crawler", title: "Recycled Crawler", year: 2022, category: "New Media", img: "/images/TUI/DSC_6518_ED.jpg" },
  { slug: "granola-cuckoo-clock", title: "Granola Cuckoo Clock", year: 2022, category: "New Media", img: "/images/TUI/DSC_6529_ED.jpg" },
  { slug: "the-rotary-vagary", title: "The Rotary Vagary", year: 2023, category: "Building", img: "/images/1.png" },
  { slug: "assembled-living", title: "Assembled Living", year: 2022, category: "Building", img: "/images/DSC_7022-c.jpg" },
  { slug: "boolean-auditorium", title: "Boolean Auditorium", year: 2022, category: "Building", img: "/images/boolean-auditorium/0425_R_Ext_3200_level light 1.42.jpg" },
];

const projectPageLink = (slug: string) => ({ text: "Project Page", href: `/projects/${slug}` });

const featuredProjectSpecs: Array<{
  slug: string;
  title?: string;
  img?: string;
  links?: ProjectLink[];
}> = [
  { slug: "hygrometric" },
  {
    slug: "micro-macro",
    img: "/images/DSC_9100-c.jpg",
    title: "Micro Macro",
  },
  {
    slug: "seeds-starter-kit",
    img: "/images/Seed/DSC_7539_bright_02-c3.jpeg",
    title: "Seeds Starter Kit",
  },
  {
    slug: "unidentified-funicular-objects",
    img: "/images/IMG_0003-ed.jpg",
    title: "Unidentified Funicular Objects",
  },
  {
    slug: "form-force-matter",
    img: "/images/DSC_9959_ed.jpg",
    title: "Form Force Matter",
  },
  {
    slug: "moment-cube",
    img: "/images/moment-cube/cube_compressed2.gif",
    title: "MomentCube",
    links: [
      projectPageLink("moment-cube"),
      {
        text: "Report",
        href: "https://drive.google.com/file/d/1IWg_7bU3prEHDrfwdtIan9II6ElAlk5S/view?usp=share_link",
      },
    ],
  },
  {
    slug: "bio-inspired-composite",
    img: "/images/m2-5_s18_c180.gif",
    title: "Bio-inspired Composites Design",
  },
  {
    slug: "interlace",
    img: "/images/IMG_1259-ed.jpg",
    title: "Interlace",
  },
  {
    slug: "bridges",
    img: "/images/CNV000021-ed.jpg",
    title: "Bridges",
  },
  {
    slug: "sacred-light",
    img: "/images/IMG_5087_BW-c.jpg",
    title: "Sacred Light",
  },
  {
    slug: "resource-rush",
    img: "/images/resource-main.png",
    title: "Resource Rush",
  },
  {
    slug: "mobility-and-housing-taipei",
    img: "/images/housing01.png",
    title: "Mobility and Housing in Taipei",
  },
  {
    slug: "assembled-living",
    img: "/images/DSC_7022-c.jpg",
    title: "Assembled Living",
  },
  {
    slug: "botani-plan",
    img: "/images/DSC_8958-c.jpg",
    title: "Botani Plan: Second Nature",
  },
  {
    slug: "the-nature-of-growth",
    img: "/images/Tree 01-c.jpeg",
    title: "The Nature of Growth",
  },
];

const featuredProjects = featuredProjectSpecs
  .map((spec) => {
    const project = projects.find((item) => item.slug === spec.slug);

    if (!project) return undefined;

    return {
      ...project,
      img: spec.img || project.img,
      title: spec.title || project.title,
      links: spec.links || [projectPageLink(project.slug)],
    };
  })
  .filter((project): project is HighlightProject => Boolean(project));

const initialHighlightIndex = Math.max(
  0,
  featuredProjects.findIndex((project) => project.slug === "hygrometric")
);
const initialPreviewIndex = Math.max(
  0,
  featuredProjects.findIndex((project) => project.slug === "hygrometric")
);

const fieldNotes: FieldNote[] = [
  {
    id: "tw-fallback",
    region: "Taiwan",
    coordinates: "coordinate pending",
    place: "North Coast and Guanyinshan National Scenic Area",
    prompt:
      "Read North Coast and Guanyinshan National Scenic Area through material aging, heat, thresholds, commerce.",
    source: "Wikipedia / Taiwan",
  },
  {
    id: "sf-fallback",
    region: "SF Bay Area",
    coordinates: "coordinate pending",
    place: "San Francisco Maritime National Park Association",
    prompt:
      "Read San Francisco Maritime National Park Association through landscape occupation, material aging, wind, thresholds.",
    source: "Wikipedia / SF Bay Area",
  },
];

const categoryOrder = [
  "Nature",
  "Construction / Fabrication",
  "Robotics",
  "Perception",
  "New Media",
  "Visualization",
  "Building",
];

const categoryLead: Record<string, string> = {
  Nature: "Living matter / atmosphere",
  "Construction / Fabrication": "Material systems / assembly",
  Robotics: "Task planning / automation",
  Perception: "Zoom / ambiguity",
  "New Media": "Tangible interface / signal",
  Visualization: "Maps / data / image",
  Building: "Mass / threshold / envelope",
};

type RouteGlyphSpec = {
  path: string;
  morph?: string[];
  secondary: string[];
  bars?: [number, number, number][];
  nodes: [number, number][];
  dash: string;
  duration: string;
  lineDuration?: string;
  nodeSize: number;
  nodeDelay: number;
  nodeDelays?: number[];
};

const routeGlyphs: Record<string, RouteGlyphSpec> = {
  nature: {
    path: "M54 82 C42 52 74 28 112 38 C154 48 170 86 146 112 C118 142 68 122 54 82 Z M166 66 C152 28 190 14 236 28 C282 42 300 78 274 108 C244 142 184 116 166 66 Z M286 78 C270 42 310 24 360 34 C414 44 438 82 408 112 C372 148 302 122 286 78 Z",
    morph: [
      "M42 74 C26 38 84 14 128 40 C172 66 174 104 136 128 C94 154 54 120 42 74 Z M150 74 C134 30 204 0 254 32 C304 64 300 102 260 126 C216 152 168 118 150 74 Z M296 70 C274 28 326 8 378 34 C438 64 448 104 400 128 C350 154 312 116 296 70 Z",
      "M66 92 C56 70 56 42 102 30 C164 14 184 78 158 104 C128 134 84 138 66 92 Z M180 56 C164 20 172 16 224 18 C292 22 322 70 286 102 C252 134 196 130 180 56 Z M272 90 C254 56 300 30 348 28 C424 24 464 74 424 106 C386 136 294 142 272 90 Z",
    ],
    secondary: [
      "M78 82 C76 62 98 52 122 58 C144 64 150 88 136 102 C116 122 84 108 78 82 Z",
      "M194 68 C190 48 212 38 242 46 C268 54 274 78 258 94 C238 114 198 96 194 68 Z",
      "M316 82 C312 62 338 52 368 58 C398 64 406 88 386 104 C362 126 320 108 316 82 Z",
      "M122 74 C156 64 194 62 230 72 C264 82 302 82 340 72",
      "M98 100 C138 118 188 116 228 98 C270 80 326 92 370 112",
    ],
    nodes: [[104, 82], [230, 74], [362, 84], [146, 112], [274, 108], [408, 112]],
    dash: "5 3.5",
    duration: "10.5s",
    nodeSize: 2.7,
    nodeDelay: 180,
  },
  "construction-fabrication": {
    path: "M76 98 L230 72 H392 M128 42 L230 72 M128 114 L230 72",
    secondary: [
      "M46 78 H98 V118 H46 Z",
      "M110 24 H162 V64 H110 Z",
      "M110 94 H162 V130 H110 Z",
      "M230 48 H306 V96 H230 Z",
      "M306 62 H372 V86 H306 Z",
    ],
    nodes: [[76, 98], [128, 42], [128, 114], [230, 72], [306, 72], [392, 72]],
    dash: "3 3",
    duration: "5s",
    lineDuration: "16s",
    nodeSize: 2.9,
    nodeDelay: 5,
    nodeDelays: [0, 300, 600, 900, 1200, 1500],
  },

  robotics: {
    path: "M28 70 H126 C168 70 168 28 210 28 H296 C338 28 338 112 380 112 H430",
    secondary: [
      "M210 28 C178 48 178 92 210 112 H296",
      "M296 28 C328 48 328 92 296 112",
      "M126 70 L126 34",
      "M380 112 L380 74",
    ],
    nodes: [[28, 70], [126, 70], [210, 28], [296, 28], [296, 112], [380, 112], [430, 112]],
    dash: "1.5 5",
    duration: "4.2s",
    nodeSize: 3.1,
    nodeDelay: 100,
  },
  perception: {
    path: "M82 64 m-36 0 a36 36 0 1 0 72 0 a36 36 0 1 0 -72 0 M110 92 L164 126",
    secondary: [
      "M46 64 H410",
      "M142 36 C198 18 264 22 330 50",
      "M142 92 C204 116 292 118 398 86",
      "M82 28 L82 100",
      "M46 64 H118",
      "M190 38 L224 54 M190 102 L226 88",
    ],
    nodes: [[150, 70], [224, 54], [286, 72], [342, 50], [398, 86], [420, 66]],
    dash: "1.5 5",
    duration: "6.8s",
    nodeSize: 2.6,
    nodeDelay: 430,
    nodeDelays: [0, 850, 1790, 2780, 3760, 4520]
    // nodeDelays: [0, 1360, 2520, 3600, 4620, 5030],
  },

  "new-media": {
    path: "M58 76 C72 56 84 42 98 42 S126 88 138 88 S164 32 178 32 S204 66 218 66 S246 24 258 24 S286 82 298 82 S326 52 338 52 S366 30 378 30 S406 70 418 70",
    secondary: [
      "M58 96 C98 78 130 106 178 54 S248 46 298 100 S362 64 418 86",
      "M58 58 C112 20 146 64 218 48 S302 16 378 50 S404 60 418 70",
      "M58 82 C120 76 160 76 218 84 S318 44 418 58",
    ],
    nodes: [[58, 76], [98, 42], [138, 88], [178, 32], [218, 66], [258, 24], [298, 82], [338, 52], [378, 30], [418, 70]],
    dash: "1.5 5",
    duration: "7.4s",
    nodeSize: 3,
    nodeDelay: 70,
  },
  visualization: {
    path: "M46 112 H410",
    secondary: [
      "M46 70 C74 48 96 48 124 70 S174 92 202 70 S252 48 280 70 S330 92 358 70 S394 52 410 62",
      "M46 44 C82 88 116 88 152 44 S222 0 258 44 S328 88 364 44",
    ],
    bars: [[62, 112, 76], [94, 112, 42], [126, 112, 88], [158, 112, 54], [190, 112, 24], [222, 112, 70], [254, 112, 38], [286, 112, 92], [318, 112, 58], [350, 112, 30], [382, 112, 82]],
    nodes: [[62, 76], [94, 42], [126, 88], [158, 54], [190, 24], [222, 70], [254, 38], [286, 92], [318, 58], [350, 30], [382, 82]],
    dash: "5 4 1 5",
    duration: "4.8s",
    nodeSize: 2.5,
    nodeDelay: 58,
  },
  building: {
      path: "M40 112 H416 M68 112 V72 H138 V112 M168 112 V44 H250 V112 M282 112 V62 H374 V112",
      secondary: [
        "M68 72 L102 50 H172 L138 72",
        "M168 44 L206 20 H288 L250 44",
        "M282 62 L320 38 H412 L374 62",
        "M138 72 H172 V112",
        "M250 44 H288 V112",
        "M374 62 H412 V112",
      ],
      nodes: [[68, 112], [68, 72], [168, 112], [168, 44], [282, 112], [282, 62], [416, 112]],
      dash: "5 3",
      duration: "7.6s",
      nodeSize: 2.9,
      nodeDelay: 115,
    },
};

function routeClass(category: string) {
  return `route-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function formatFieldTime(date: Date, region: FieldNote["region"]) {
  const timeZone = region === "Taiwan" ? "Asia/Taipei" : "America/Los_Angeles";

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

function CategoryGlyph({ category, className = "" }: { category: string; className?: string }) {
  const route = routeClass(category);
  const routeKey = route.replace("route-", "");
  const glyph = routeGlyphs[routeKey] || routeGlyphs.building;
  const lineStyle = { animationDuration: glyph.lineDuration ?? glyph.duration };
  const morphValues = glyph.morph
    ? [glyph.path, ...glyph.morph, glyph.path].join(";")
    : undefined;

  return (
    <svg viewBox="0 0 460 140" aria-hidden="true" className={`${route} ${className}`}>
      {routeKey !== "nature"
        ? glyph.secondary.map((path, index) => (
            <path
              key={`${category}-secondary-underlay-${index}`}
              className="glyph-secondary-underlay"
              d={path}
              fill="none"
              stroke="currentColor"
            />
          ))
        : null}
      {glyph.secondary.map((path, index) => (
        <path
          key={`${category}-secondary-${index}`}
          className="glyph-secondary"
          d={path}
          fill="none"
          stroke="currentColor"
          strokeDasharray={glyph.dash}
          style={lineStyle}
        />
      ))}
      {glyph.bars?.map(([x, y1, y2], index) => (
        <line
          key={`${category}-bar-${index}`}
          className="glyph-bar"
          x1={x}
          x2={x}
          y1={y1}
          y2={y2}
          stroke="currentColor"
          style={{
            animationDelay: `${index * glyph.nodeDelay}ms`,
            animationDuration: glyph.duration,
          }}
        />
      ))}
      <path
        className="glyph-route"
        d={glyph.path}
        fill="none"
        stroke="currentColor"
        strokeDasharray={glyph.dash}
        style={lineStyle}
      >
        {morphValues ? (
          <animate
            attributeName="d"
            dur="15s"
            repeatCount="indefinite"
            values={morphValues}
          />
        ) : null}
      </path>
      {glyph.nodes.map(([cx, cy], index) => (
        <circle
          key={`${category}-node-${index}`}
          className="route-node"
          cx={cx}
          cy={cy}
          r={glyph.nodeSize}
          fill="currentColor"
          style={{
            animationDelay: `${glyph.nodeDelays?.[index] ?? index * glyph.nodeDelay}ms`,
            animationDuration: glyph.duration,
          }}
        />
      ))}
    </svg>
  );
}

function FieldNoteCard({ note, now }: { note: FieldNote; now: Date }) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timeLabel = note.region === "Taiwan" ? "GMT+8" : "Pacific Time";
  const hasImage = Boolean(note.imageUrl);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <article className="border-b border-black pb-2 pt-4">
      <div className="mb-3 grid grid-cols-2 gap-2 text-[10px] font-normal uppercase tracking-[0.16em] text-neutral-400">
        <span>{note.region}</span>
        <span className="text-right text-black">{note.coordinates}</span>
      </div>
      {note.url ? (
        <a href={note.url} target="_blank" rel="noreferrer" className="block transition-opacity hover:opacity-45">
          <h2 className="text-[25px] font-normal uppercase leading-[0.95] tracking-normal">
            {note.place}
          </h2>
        </a>
      ) : (
        <h2 className="text-[25px] font-normal uppercase leading-[0.95] tracking-normal">
          {note.place}
        </h2>
      )}
      <p className="mt-4 text-sm leading-6 text-neutral-700">{note.prompt}</p>
      {hasImage ? (
        <button
          type="button"
          aria-expanded={isImageOpen}
          className={`field-image-reveal mt-4 w-full border border-black text-left ${
            isImageOpen ? "is-open" : ""
          }`}
          onClick={() => setIsImageOpen((open) => !open)}
        >
          <span className="field-image-reveal-label">Field image</span>
          <span className="field-image-reveal-mark">+</span>
          <span className="field-image-reveal-panel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={note.imageUrl}
              alt={note.imageAlt || note.place}
              className="h-full w-full object-cover"
            />
          </span>
        </button>
      ) : null}
      <dl className="mt-3 grid grid-cols-2 border-t border-black pb-1 pt-2 text-[10px] font-normal uppercase tracking-[0.16em] text-neutral-400">
        <dt>{timeLabel}</dt>
        <dd className="text-right text-neutral-700">{mounted ? formatFieldTime(now, note.region) : "—"}</dd>
        <dt className="mt-1.5">Source</dt>
        <dd className="mt-1.5 text-right text-neutral-700">
          {note.url ? (
            <a href={note.url} target="_blank" rel="noreferrer">
              {note.source}
            </a>
          ) : (
            note.source
          )}
        </dd>
      </dl>
    </article>
  );
}

function HighlightCard({
  project,
  wide = false,
  priority = false,
  onActivate,
}: {
  project: HighlightProject;
  wide?: boolean;
  priority?: boolean;
  onActivate?: () => void;
}) {
  const imageIsAnimated = project.img.toLowerCase().endsWith(".gif");

  return (
    <article className="group highlight-card relative" onFocus={onActivate}>
      <div className="relative aspect-[1.78/1] overflow-hidden bg-neutral-100">
        <Image
          src={project.img}
          alt={project.title}
          fill
          unoptimized={imageIsAnimated}
          priority={priority}
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
          sizes={wide ? "(min-width: 1280px) 56vw, 82vw" : "(min-width: 1024px) 36vw, 100vw"}
          className="object-cover transition duration-500 ease-out group-hover:opacity-90"
        />
        <span className="absolute left-4 top-4 border border-white/75 bg-black/15 px-4 py-2 text-[10px] font-normal uppercase tracking-[0.14em] text-white">
          {project.category}
        </span>
        <CategoryGlyph
          category={project.category}
          className={`route-overlay category-index-icon highlight-route-overlay absolute bottom-5 left-5 h-20 w-56 ${routeClass(project.category)}`}
        />
      </div>
      <div className="pt-0.5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{project.category}</p>
        <h3 className="mt-0.5 border-b border-black pb-1.5 text-[31px] font-normal uppercase leading-none tracking-normal">
          {project.title}
        </h3>
        <div className="grid grid-cols-[1fr_auto] gap-4 py-1.5 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
          <p>{project.label || categoryLead[project.category]}</p>
          <span>{project.year}</span>
        </div>
        <div className="mt-0 flex flex-wrap gap-x-5 gap-y-1 pb-1.5">
          {project.links.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={`${project.slug}-${link.text}`}
                href={link.href}
                className="inline-block border-b border-black text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-700"
              >
                {link.text}
              </Link>
            ) : (
              <a
                key={`${project.slug}-${link.text}`}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-block border-b border-black text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-700"
              >
                {link.text}
              </a>
            )
          )}
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [active, setActive] = useState("Show All");
  const [highlightIndex, setHighlightIndex] = useState(initialHighlightIndex);
  const [previewIndex, setPreviewIndex] = useState(initialPreviewIndex);
  const [fieldNoteItems, setFieldNoteItems] = useState<FieldNote[]>(fieldNotes);
  const [now, setNow] = useState(() => new Date());
  const highlightScrollerRef = useRef<HTMLDivElement>(null);
  const highlightSettleTimerRef = useRef<number | undefined>(undefined);
  const dragStateRef = useRef({
    active: false,
    moved: false,
    scrollLeft: 0,
    startX: 0,
  });
  const ignoreScrollSyncRef = useRef(false);

  const categories = useMemo(
    () => [
      { name: "Show All", count: projects.length },
      ...Array.from(new Set(projects.map((project) => project.category))).map((category) => ({
        name: category,
        count: projects.filter((project) => project.category === category).length,
      })),
    ],
    []
  );

  const filtered =
    active === "Show All" ? projects : projects.filter((project) => project.category === active);

  const highlightProjects = featuredProjects;
  const currentPreviewIndex = wrapIndex(previewIndex, highlightProjects.length);
  const previewProject = highlightProjects[currentPreviewIndex] || highlightProjects[0] || projects[0];
  const activeCategory = previewProject.category;

  const previewHighlight = (index: number) => {
    setPreviewIndex(wrapIndex(index, highlightProjects.length));
  };

  const getMostVisibleHighlightIndex = (scroller: HTMLDivElement) => {
    const cards = Array.from(scroller.querySelectorAll<HTMLElement>("[data-highlight-card]"));
    const scrollerRect = scroller.getBoundingClientRect();
    let bestIndex = currentPreviewIndex;
    let bestVisibleWidth = -1;

    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const visibleWidth = Math.max(
        0,
        Math.min(cardRect.right, scrollerRect.right) - Math.max(cardRect.left, scrollerRect.left)
      );
      const index = Number(card.dataset.highlightIndex);

      if (visibleWidth > bestVisibleWidth && Number.isFinite(index)) {
        bestVisibleWidth = visibleWidth;
        bestIndex = index;
      }
    });

    return wrapIndex(bestIndex, highlightProjects.length);
  };

  const scrollToHighlight = (index: number, behavior: ScrollBehavior = "auto") => {
    const scroller = highlightScrollerRef.current;
    const nextIndex = wrapIndex(index, highlightProjects.length);
    const card = scroller?.querySelector<HTMLElement>(`[data-highlight-index="${nextIndex}"]`);
    const firstCard = scroller?.querySelector<HTMLElement>("[data-highlight-card]");

    if (!scroller || !card || !firstCard) return;

    ignoreScrollSyncRef.current = true;
    scroller.scrollTo({
      left: card.offsetLeft - firstCard.offsetLeft,
      behavior,
    });
    window.setTimeout(() => {
      ignoreScrollSyncRef.current = false;
    }, behavior === "smooth" ? 520 : 80);
  };

  const goToHighlight = (index: number, behavior: ScrollBehavior = "auto", update: "now" | "settle" = "now") => {
    const nextIndex = wrapIndex(index, highlightProjects.length);

    if (highlightSettleTimerRef.current) {
      window.clearTimeout(highlightSettleTimerRef.current);
    }

    if (update === "now") {
      setHighlightIndex(nextIndex);
      setPreviewIndex(nextIndex);
    } else {
      highlightSettleTimerRef.current = window.setTimeout(() => {
        setHighlightIndex(nextIndex);
        setPreviewIndex(nextIndex);
      }, 420);
    }

    scrollToHighlight(nextIndex, behavior);
  };

  const setCategory = (category: string) => {
    setActive(category);
    const nextIndex =
      category === "Show All"
        ? initialHighlightIndex
        : highlightProjects.findIndex((project) => project.category === category);

    if (nextIndex >= 0) {
      goToHighlight(nextIndex, "smooth", "settle");
    }
  };

  const slideHighlights = (step: 1 | -1) => {
    const nextIndex = wrapIndex(currentPreviewIndex + step, highlightProjects.length);

    goToHighlight(nextIndex, "smooth", "settle");
  };

  const handleHighlightScroll = (event: UIEvent<HTMLDivElement>) => {
    if (ignoreScrollSyncRef.current) return;

    const nextIndex = getMostVisibleHighlightIndex(event.currentTarget);

    setHighlightIndex((index) => (index === nextIndex ? index : nextIndex));
    setPreviewIndex((index) => (index === nextIndex ? index : nextIndex));
  };

  const handleHighlightPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("a")) return;

    dragStateRef.current = {
      active: true,
      moved: false,
      scrollLeft: event.currentTarget.scrollLeft,
      startX: event.clientX,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleHighlightPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState.active) return;

    const deltaX = event.clientX - dragState.startX;

    if (Math.abs(deltaX) > 10) {
      dragState.moved = true;
    }

    event.currentTarget.scrollLeft = dragState.scrollLeft - deltaX;
  };

  const handleHighlightPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState.active) return;

    dragState.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  useEffect(() => {
    if (highlightScrollerRef.current) {
      highlightScrollerRef.current.scrollLeft = 0;
    }
    setHighlightIndex(initialHighlightIndex);
    setPreviewIndex(initialHighlightIndex);
    scrollToHighlight(initialHighlightIndex, "auto");
    window.requestAnimationFrame(() => {
      if (highlightScrollerRef.current) {
        highlightScrollerRef.current.scrollLeft = 0;
      }
      setHighlightIndex(initialHighlightIndex);
      setPreviewIndex(initialHighlightIndex);
      scrollToHighlight(initialHighlightIndex, "auto");
    });
  }, []);

  useEffect(
    () => () => {
      if (highlightSettleTimerRef.current) {
        window.clearTimeout(highlightSettleTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/local-field-notes")
      .then((response) => (response.ok ? response.json() : undefined))
      .then((data) => {
        if (!isMounted || !data?.taiwan || !data?.sfBay) return;
        setFieldNoteItems([data.taiwan, data.sfBay]);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="material-field">
      <section className="mx-auto grid max-w-[1680px] grid-cols-1 border-b border-black px-4 md:px-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-black py-6 lg:flex lg:max-h-[calc(100vh-57px)] lg:min-h-[calc(100vh-57px)] lg:flex-col lg:border-b-0 lg:border-r lg:pr-6">
          <div className="border-y border-black py-3">
            <div className="grid grid-cols-2 text-[11px] font-normal uppercase tracking-[0.2em] text-neutral-400">
              <span>Daily field notes</span>
              <span className="text-right">{now.toISOString().slice(0, 10)} UTC</span>
            </div>
          </div>
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto no-scrollbar lg:pr-2">
            <div>
              {fieldNoteItems.map((note) => (
                <FieldNoteCard key={note.id} note={note} now={now} />
              ))}
            </div>
            <div className="mt-5 border-y border-black py-5">
              <p className="text-[11px] font-normal uppercase tracking-[0.18em] text-neutral-400">
                Observation thread
              </p>
              <p className="mt-5 max-w-[250px] text-sm leading-6 text-neutral-800">
                humidity as actuator / wood remembers water
              </p>
            </div>
          </div>
        </aside>

        <section className="pt-6 pb-4 lg:pl-6">
          <div className="border-y border-black py-1.5">
            <div className="grid gap-3 md:grid-cols-[minmax(0,0.46fr)_minmax(220px,0.44fr)_auto] md:items-center">
              <div>
                <p className="text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-400">
                  Highlights
                </p>
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={previewProject.slug}
                    initial={{ y: 14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -14, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="mt-2 text-4xl font-normal uppercase leading-none tracking-normal"
                  >
                    {previewProject.title}
                  </motion.h1>
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-5 text-[13px] font-normal uppercase tracking-[0.16em] md:self-center">
                <span aria-hidden className="hidden h-[34px] border-l border-black md:block" />
                <div className="leading-[1.35]">
                  <p>{activeCategory === "Perception" ? "Perceptual study" : activeCategory}</p>
                  <p className="mt-1 text-neutral-400">{categoryLead[activeCategory] || "Selected study"}</p>
                </div>
              </div>
              <div className="flex justify-self-end gap-2">
                <button
                  type="button"
                  aria-label="Previous highlight"
                  onClick={() => slideHighlights(-1)}
                  className="grid h-9 w-9 place-items-center border border-black text-sm font-normal hover:bg-black hover:text-[#fbfaf7]"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  aria-label="Next highlight"
                  onClick={() => slideHighlights(1)}
                  className="grid h-9 w-9 place-items-center border border-black text-sm font-normal hover:bg-black hover:text-[#fbfaf7]"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>

          <div className="news-strip mt-2 flex items-baseline gap-4 px-2 py-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            <span className="shrink-0">Apr 16, 2026</span>

            <span>
              <span className="text-black">
                I presented my first-authored paper{" "}
                <a
                  href="/projects/hygrometric"
                  className="font-semibold text-black hover:text-neutral-500"
                >
                  Hygrometric
                </a>{" "}
                at{" "}
                <a
                  href="https://chi2026.acm.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-black hover:text-neutral-500"
                >
                  CHI 2026 in Barcelona!
                </a>
              </span>{" "}
              <a
                href="https://dl.acm.org/doi/10.1145/3772318.3791333"
                target="_blank"
                rel="noreferrer"
                className="border-b border-black text-black hover:border-neutral-400 hover:text-neutral-500"
              >
                DOI
              </a>{" "}
              <a
                href="https://dl.acm.org/doi/epdf/10.1145/3772318.3791333"
                target="_blank"
                rel="noreferrer"
                className="border-b border-black text-black hover:border-neutral-400 hover:text-neutral-500"
              >
                PDF
              </a>
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 border-l border-t border-black md:grid-cols-4 xl:grid-cols-7">
            {categoryOrder.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategory(category)}
                className={`category-index-item ${
                  category === activeCategory
                    ? "is-active"
                    : ""
                } min-h-[94px] border-b border-r border-black p-1.5 text-left`}
              >
                <CategoryGlyph category={category} className="category-index-icon h-14 w-full" />
                <span className="block text-[10px] font-normal uppercase leading-4 tracking-[0.14em]">
                  {category}
                </span>
              </button>
            ))}
          </div>

          <div
            ref={highlightScrollerRef}
            className="highlight-carousel no-scrollbar mt-2 overflow-x-auto"
            onPointerDown={handleHighlightPointerDown}
            onPointerMove={handleHighlightPointerMove}
            onPointerUp={handleHighlightPointerUp}
            onPointerCancel={handleHighlightPointerUp}
            onScroll={handleHighlightScroll}
          >
            <div className="flex gap-4">
              {highlightProjects.map((project, index) => (
                <div
                  key={project.slug}
                  data-highlight-card
                  data-highlight-index={index}
                  className="highlight-track-card"
                >
                  <HighlightCard
                    project={project}
                    wide
                    priority={index < 2}
                    onActivate={() => previewHighlight(index)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 border-t border-black" />

          <div className="mt-2 border-t border-black py-2">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-500">
              <span>{String(currentPreviewIndex + 1).padStart(2, "0")}</span>
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${highlightProjects.length}, minmax(0, 1fr))` }}
              >
                {highlightProjects.map((project, index) => (
                  <button
                    key={project.slug}
                    type="button"
                    aria-label={`Show ${project.title}`}
                    onClick={() => goToHighlight(index, "smooth", "settle")}
                    className={`h-2 border border-black transition-colors ${
                      index === currentPreviewIndex ? "bg-black" : "bg-transparent hover:bg-neutral-300"
                    }`}
                  >
                    <span className="sr-only">{project.title}</span>
                  </button>
                ))}
              </div>
              <span>{String(highlightProjects.length).padStart(2, "0")}</span>
            </div>
            <p className="mt-2 text-xs font-normal uppercase tracking-[0.16em]">
              {previewProject.title}
            </p>
          </div>
        </section>
      </section>

      <section id="projects-section" className="scroll-mt-24 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-[1680px]">
          {/* <div className="mb-6 grid py-5 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.38fr)] md:items-end">
            <div>
              <p className="text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-400">
                Selected work
              </p>
              <h2 className="mt-2 text-[44px] font-normal uppercase leading-none tracking-normal md:text-[64px]">
                Projects
              </h2>
            </div>
              <p className="max-w-6xl text-sm leading-6 text-neutral-600 md:justify-self-end md:text-right">
                Quantitative and qualitative in approach, poetic and artistic in expression, and innovative in form.<br />
                This body of work explores research, computation, material systems, and perception.
              </p>
          </div> */}
          <div className="mt-8 mb-8 grid gap-5 md:grid-cols-[0.35fr_1.65fr] md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                Selected Work
              </p>
              <h2 className="mt-2 text-4xl font-light uppercase tracking-normal md:text-6xl">
                Projects
              </h2>
            </div>

            <p className="max-w-none text-sm leading-6 text-neutral-600 md:justify-self-end md:text-right">
              Quantitative and qualitative in approach, poetic and artistic in expression, and innovative in form.<br />
              This body of work explores research, computation, material systems, and perception.
            </p>
          </div>
          <FilterBar categories={categories} active={active} setActive={setCategory} />

          <div className="mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3">
            <AnimatePresence>
              {filtered.map((project) => (
                <motion.div
                  key={project.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="mb-6 break-inside-avoid"
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </main>
  );
}
