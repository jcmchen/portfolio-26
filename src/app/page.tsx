"use client";

import Image from "next/image";
import Link from "next/link";
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
import { projects, type Project } from "@/data/projects";

type ProjectLink = {
  text: string;
  href: string;
};

type HighlightProject = Project & {
  img: string;
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

type FieldNoteUnavailable = {
  region: "Taiwan" | "SF Bay Area";
  message: string;
};

const projectPageLink = (slug: string) => ({ text: "Project Page", href: `/projects/${slug}` });

const featuredProjectSpecs: Array<{
  slug: string;
  title?: string;
  img?: string;
  links?: ProjectLink[];
}> = [
  {
    slug: "hygrometric",
  },
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
      img: spec.img || project.thumbnail,
      title: spec.title || project.title,
      links: spec.links || [projectPageLink(project.slug), ...(project.resources || [])],
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

const fieldNotes: FieldNote[] = [];

const categoryOrder = [
  "Nature",
  "Construction / Fabrication",
  "Robotics",
  "Perception",
  "New Media",
  "Visualization",
  "Building",
];

const highlightIndicesByCategory = Object.fromEntries(
  categoryOrder.map((category) => [
    category,
    featuredProjects.flatMap((project, index) =>
      project.category === category ? [index] : []
    ),
  ])
) as Record<string, number[]>;

const categoryLead: Record<string, string> = {
  Nature: "Living matter / atmosphere",
  "Construction / Fabrication": "Material systems / assembly",
  Robotics: "Task planning / automation",
  Perception: "Zoom / ambiguity",
  "New Media": "Tangible interface / signal",
  Visualization: "Maps / data / image",
  Building: "Mass / threshold / envelope",
};

const projectOrderByCategory: Record<string, string[]> = {
  Nature: [
    "hygrometric",
    "seeds-starter-kit",
    "bio-inspired-composite",
    "botani-plan",
    "floating-structures",
    "the-nature-of-growth",
  ],
  "Construction / Fabrication": [
    "form-force-matter",
    "bridges",
    "unidentified-funicular-objects",
    "interlace",
    "slime-spring-structure",
    "hanger-games",
    "bridge-x",
  ],
  Robotics: [
    "resource-rush",
    "task-and-motion-planning",
  ],
  Perception: [
    "micro-macro",
    "sacred-light",
    "yuan",
    "fold-and-cut",
    "illustrations",
  ],
  "New Media": [
    "moment-cube",
    "our-grandmas-fridge",
    "tangi-growth",
    "capacitive-salad",
    "recycled-crawler",
    "granola-cuckoo-clock",
  ],
  Visualization: [
    "mobility-and-housing-taipei",
    "computer-graphics-imaging",
  ],
  Building: [
    "the-rotary-vagary",
    "assembled-living",
    "boolean-auditorium",
  ],
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
        className={`glyph-route ${morphValues ? "glyph-route-static" : ""}`}
        d={glyph.path}
        fill="none"
        stroke="currentColor"
        strokeDasharray={glyph.dash}
        style={lineStyle}
      />
      {morphValues ? (
        <path
          className="glyph-route glyph-route-morph"
          d={glyph.path}
          fill="none"
          stroke="currentColor"
          strokeDasharray={glyph.dash}
          style={lineStyle}
        >
          <animate
            attributeName="d"
            dur="15s"
            repeatCount="indefinite"
            values={morphValues}
          />
        </path>
      ) : null}
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

function FieldNoteCard({ note }: { note: FieldNote }) {
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const hasImage = Boolean(note.imageUrl);
  const promptId = `field-note-prompt-${note.id}`;
  const sourceLabel = note.source.split(" / ")[0];

  return (
    <article className="snap-start border-b-0 border-black pb-2 pt-4 lg:border-b">
      <div className="mb-2.5 grid grid-cols-1 items-baseline gap-2 text-[10px] font-normal uppercase tracking-[0.16em] text-neutral-500 lg:grid-cols-2">
        <span>{note.region}</span>
        <span className="hidden text-right lg:block">{note.coordinates}</span>
      </div>
      {note.url ? (
        <h2 className="text-[18px] font-normal uppercase leading-[1.02] tracking-normal lg:text-[26px] lg:leading-[0.98]">
          <a
            href={note.url}
            target="_blank"
            rel="noreferrer"
            className="group inline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <span className="underline decoration-transparent underline-offset-[3px] transition-[text-decoration-color] group-hover:decoration-current group-focus-visible:decoration-current lg:underline-offset-[0.14em]">
              {note.place}
            </span>{" "}
            <span
              aria-hidden="true"
              className="inline-block text-[0.62em] align-top transition-transform group-hover:-translate-y-px group-hover:translate-x-px"
            >
              ↗
            </span>
            <span className="sr-only"> Opens Wikipedia in a new tab.</span>
          </a>
        </h2>
      ) : (
        <h2 className="text-[18px] font-normal uppercase leading-[1.02] tracking-normal lg:text-[26px] lg:leading-[0.98]">
          {note.place}
        </h2>
      )}
      {hasImage ? (
        <button
          type="button"
          aria-expanded={isPromptVisible}
          aria-controls={promptId}
          aria-label={`${isPromptVisible ? "Hide" : "Show"} a closer look at ${note.place}`}
          aria-describedby={promptId}
          className={`field-note-image mt-4 w-full text-left ${
            isPromptVisible ? "is-prompt-visible" : ""
          } ${isPromptDismissed ? "is-prompt-dismissed" : ""}`}
          onClick={() => {
            setIsPromptVisible(!isPromptVisible);
            setIsPromptDismissed(isPromptVisible);
          }}
          onPointerLeave={() => setIsPromptDismissed(false)}
          onBlur={() => setIsPromptDismissed(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={note.imageUrl}
            alt={note.imageAlt || note.place}
            className="h-full w-full object-cover"
          />
          <span id={promptId} className="field-note-prompt-overlay">
            <span className="field-note-prompt-text">{note.prompt}</span>
          </span>
        </button>
      ) : (
        <p className="mt-4 text-sm leading-6 text-neutral-700">{note.prompt}</p>
      )}
      <dl className="mt-3 grid grid-cols-2 border-t border-black pb-1 pt-2 text-[10px] font-normal uppercase tracking-[0.14em] text-neutral-500">
        <dt>Source</dt>
        <dd className="text-right text-neutral-500">
          {note.url ? sourceLabel : note.source}
        </dd>
      </dl>
    </article>
  );
}

function HighlightCard({
  project,
  active = false,
  wide = false,
  priority = false,
  onActivate,
}: {
  project: HighlightProject;
  active?: boolean;
  wide?: boolean;
  priority?: boolean;
  onActivate?: () => void;
}) {
  const imageIsAnimated = project.img.toLowerCase().endsWith(".gif");

  return (
    <article
      className={`group highlight-card relative ${active ? "is-active" : ""}`}
      onFocus={onActivate}
    >
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
        <CategoryGlyph
          key={`${project.slug}-${active ? "active" : "idle"}`}
          category={project.category}
          className={`route-overlay category-index-icon highlight-route-overlay absolute bottom-5 left-5 h-20 w-56 ${routeClass(project.category)}`}
        />
      </div>
      <div className="pt-0.5">
        <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-black py-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500 lg:hidden">
          <p>{project.category}</p>
          <span>{project.year}</span>
        </div>
        <p className="hidden text-[11px] uppercase tracking-[0.2em] text-neutral-500 lg:block">{project.category}</p>
        <h3 className="mt-0.5 hidden border-b border-black pb-1.5 text-[31px] font-normal uppercase leading-none tracking-normal lg:block">
          {project.title}
        </h3>
        <div className="hidden grid-cols-[1fr_auto] gap-4 py-1.5 text-[11px] uppercase tracking-[0.16em] text-neutral-500 lg:grid">
          <p>{project.label || categoryLead[project.category]}</p>
          <span>{project.year}</span>
        </div>
        <div className="mt-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 py-2 lg:pb-1.5 lg:pt-0">
          {project.links.map((link, index) => (
            <span key={`${project.slug}-${link.text}`} className="inline-flex items-center gap-1.5">
              {index > 0 ? (
                <span aria-hidden="true" className="text-[11px] text-neutral-400">
                  |
                </span>
              ) : null}
              {link.href.startsWith("/") ? (
                <Link
                  href={link.href}
                  className="inline-block border-b-0 border-black text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-700 underline decoration-1 underline-offset-[3px] lg:border-b lg:no-underline"
                >
                  {link.text}
                </Link>
              ) : (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block border-b-0 border-black text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-700 underline decoration-1 underline-offset-[3px] lg:border-b lg:no-underline"
                >
                  {link.text}
                </a>
              )}
            </span>
          ))}
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
  const [fieldNoteUnavailable, setFieldNoteUnavailable] = useState<FieldNoteUnavailable[]>([]);
  const [fieldNotesLoading, setFieldNotesLoading] = useState(true);
  const [newsRevealKey, setNewsRevealKey] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const highlightScrollerRef = useRef<HTMLDivElement>(null);
  const highlightCategoryScrollerRef = useRef<HTMLDivElement>(null);
  const newsLineRef = useRef<HTMLParagraphElement>(null);
  const highlightSettleTimerRef = useRef<number | undefined>(undefined);
  const scrollSyncReleaseTimerRef = useRef<number | undefined>(undefined);
  const dragStateRef = useRef({
    active: false,
    moved: false,
    scrollLeft: 0,
    startX: 0,
  });
  const ignoreScrollSyncRef = useRef(false);
  const categoryCycleRef = useRef<{ category: string; position: number } | null>(null);

  useEffect(() => {
    const replayNewsReveal = () => {
      setNewsRevealKey((current) => current + 1);
    };
    window.addEventListener("portfolio:home-enter", replayNewsReveal);
    return () => {
      window.removeEventListener("portfolio:home-enter", replayNewsReveal);
    };
  }, []);

  useEffect(() => {
    const line = newsLineRef.current;
    if (!line) return;

    let sheenAnimations: Animation[] = [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncSheenMetrics = () => {
      sheenAnimations.forEach((animation) => animation.cancel());
      sheenAnimations = [];
      if (reducedMotion.matches) return;

      const lineRect = line.getBoundingClientRect();
      const highlights = Array.from(
        line.querySelectorAll<HTMLElement>(".news-thinking-highlight")
      );
      const highlightRects = highlights.map((highlight) =>
        highlight.getBoundingClientRect()
      );
      const first = highlightRects[0];
      const last = highlightRects.at(-1);
      if (!first || !last) return;

      const sweepStart = first.left - lineRect.left - 24;
      const sweepEnd = last.right - lineRect.left + 24;
      const sweepDistance = Math.max(1, sweepEnd - sweepStart);
      const sweepDuration = 5_500;
      const cycleDuration = 8_500;

      sheenAnimations = highlights.map((highlight, index) => {
        const rect = highlightRects[index];
        const enter = Math.max(
          0,
          ((rect.left - lineRect.left - 24 - sweepStart) / sweepDistance) *
            sweepDuration
        );
        const leave = Math.min(
          sweepDuration,
          ((rect.right - lineRect.left + 24 - sweepStart) / sweepDistance) *
            sweepDuration
        );
        return highlight.animate(
          [
            { backgroundPosition: "100% 50%", offset: 0 },
            {
              backgroundPosition: "100% 50%",
              offset: enter / cycleDuration,
            },
            {
              backgroundPosition: "0% 50%",
              offset: leave / cycleDuration,
            },
            { backgroundPosition: "0% 50%", offset: 1 },
          ],
          {
            duration: cycleDuration,
            delay: 1_900,
            iterations: Infinity,
            easing: "linear",
          }
        );
      });
    };

    syncSheenMetrics();
    const resizeObserver = new ResizeObserver(syncSheenMetrics);
    resizeObserver.observe(line);
    const handleMotionPreference = () => syncSheenMetrics();
    reducedMotion.addEventListener("change", handleMotionPreference);
    return () => {
      resizeObserver.disconnect();
      reducedMotion.removeEventListener("change", handleMotionPreference);
      sheenAnimations.forEach((animation) => animation.cancel());
    };
  }, [newsRevealKey]);

  const projectGroups = useMemo(
    () =>
      categoryOrder
        .map((category) => ({
          category,
          projects: projects
            .filter((project) => project.category === category)
            .sort((a, b) => {
              const order = projectOrderByCategory[category] || [];
              const aIndex = order.indexOf(a.slug);
              const bIndex = order.indexOf(b.slug);

              if (aIndex === -1 && bIndex === -1) return 0;
              if (aIndex === -1) return 1;
              if (bIndex === -1) return -1;

              return aIndex - bIndex;
            }),
        }))
        .filter((group) => group.projects.length > 0),
    []
  );

  const categories = useMemo(
    () => [
      { name: "Show All", count: projects.length },
      ...projectGroups.map((group) => ({
        name: group.category,
        count: group.projects.length,
      })),
    ],
    [projectGroups]
  );

  const mobileProjects = useMemo(
    () =>
      active === "Show All"
        ? projectGroups.flatMap((group) => group.projects)
        : projectGroups.find((group) => group.category === active)?.projects ?? [],
    [active, projectGroups]
  );

  const highlightProjects = featuredProjects;
  const currentPreviewIndex = wrapIndex(previewIndex, highlightProjects.length);
  const previewProject = highlightProjects[currentPreviewIndex] || highlightProjects[0] || projects[0];
  const activeCategory = previewProject.category;
  const activeCategoryPosition = (highlightIndicesByCategory[activeCategory] || []).indexOf(
    currentPreviewIndex
  );

  useEffect(() => {
    const scroller = highlightCategoryScrollerRef.current;
    const mobileViewport = window.matchMedia("(max-width: 1023px)");

    if (!scroller || !mobileViewport.matches) return;

    const activeItem = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-highlight-category]")
    ).find((item) => item.dataset.highlightCategory === activeCategory);

    if (!activeItem) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    const edgePadding = 8;
    const isFullyVisible =
      itemRect.left >= scrollerRect.left + edgePadding &&
      itemRect.right <= scrollerRect.right - edgePadding;

    if (isFullyVisible) return;

    const targetLeft = Math.max(
      0,
      Math.min(
        activeItem.offsetLeft - (scroller.clientWidth - activeItem.offsetWidth) / 2,
        scroller.scrollWidth - scroller.clientWidth
      )
    );
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    scroller.scrollTo({
      left: targetLeft,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [activeCategory]);

  const previewHighlight = (index: number) => {
    categoryCycleRef.current = null;
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

    if (scrollSyncReleaseTimerRef.current) {
      window.clearTimeout(scrollSyncReleaseTimerRef.current);
    }

    ignoreScrollSyncRef.current = true;
    scroller.scrollTo({
      left: card.offsetLeft - firstCard.offsetLeft,
      behavior,
    });
    scrollSyncReleaseTimerRef.current = window.setTimeout(() => {
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

  const setHighlightCategory = (category: string) => {
    const categoryIndices = highlightIndicesByCategory[category] || [];
    const previousCycle = categoryCycleRef.current;
    const nextPosition =
      previousCycle?.category === category
        ? (previousCycle.position + 1) % categoryIndices.length
        : 0;
    const nextIndex = categoryIndices[nextPosition];

    if (Number.isInteger(nextIndex)) {
      categoryCycleRef.current = { category, position: nextPosition };
      goToHighlight(nextIndex, "smooth", "now");
    }
  };

  const slideHighlights = (step: 1 | -1) => {
    categoryCycleRef.current = null;
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

    categoryCycleRef.current = null;
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
      if (scrollSyncReleaseTimerRef.current) {
        window.clearTimeout(scrollSyncReleaseTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const apiParams = new URLSearchParams();
    if (process.env.NODE_ENV !== "production") {
      const pageParams = new URLSearchParams(window.location.search);
      const taiwanOverride = pageParams.get("tw");
      const sfBayOverride = pageParams.get("sf");
      if (taiwanOverride) apiParams.set("tw", taiwanOverride);
      if (sfBayOverride) apiParams.set("sf", sfBayOverride);
    }
    const fieldNotesEndpoint = apiParams.size
      ? `/api/local-field-notes?${apiParams.toString()}`
      : "/api/local-field-notes";

    fetch(fieldNotesEndpoint)
      .then((response) =>
        response.ok || response.status === 503 ? response.json() : Promise.reject(new Error("Field notes request failed"))
      )
      .then((data) => {
        if (!isMounted) return;
        setFieldNoteItems(
          [data?.taiwan, data?.sfBay].filter((item): item is FieldNote => Boolean(item))
        );
        setFieldNoteUnavailable(data?.unavailable || []);
        setFieldNotesLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setFieldNoteItems([]);
        setFieldNoteUnavailable([
          {
            region: "Taiwan",
            message: "Today’s local field note is temporarily unavailable.",
          },
          {
            region: "SF Bay Area",
            message: "Today’s local field note is temporarily unavailable.",
          },
        ]);
        setFieldNotesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="material-field lg:flex lg:min-h-[calc(100svh-53px)] lg:flex-col">
      <section
        key={newsRevealKey}
        aria-label="Latest news"
        className="news-banner-enter shrink-0 overflow-hidden border-b border-neutral-300 bg-[#ece9e1] text-black"
      >
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 text-[10px] font-normal md:flex-nowrap md:px-8">
          <span className="shrink-0 font-medium uppercase tracking-[0.16em] text-black">News</span>
          <time dateTime="2026-04-16" className="shrink-0 uppercase tracking-[0.16em] text-neutral-500">
            Apr 16, 2026
          </time>
          <p
            ref={newsLineRef}
            className="news-thinking-line min-w-0 basis-full text-[11px] tracking-[0.08em] text-neutral-700 md:basis-auto md:flex-1"
          >
            I presented my first-authored paper{" "}
            <a
              href="/projects/hygrometric"
              className="news-emphasis-link font-semibold text-black"
            >
              <span className="news-thinking-highlight">HygroMetric</span>
            </a>{" "}
            at{" "}
            <a
              href="https://chi2026.acm.org/"
              target="_blank"
              rel="noreferrer"
              className="news-emphasis-link font-semibold text-black"
            >
              <span className="news-thinking-highlight">
                ACM CHI 2026 in Barcelona
              </span>
            </a>
            !{" "}
            <a
              href="https://dl.acm.org/doi/10.1145/3772318.3791333"
              target="_blank"
              rel="noreferrer"
              className="border-b-0 border-black underline decoration-1 underline-offset-[3px] transition-colors hover:border-neutral-500 hover:text-neutral-500 lg:border-b lg:no-underline"
            >
              DOI
            </a>
            {" "}
            <span aria-hidden="true" className="text-neutral-400">
              |
            </span>
            {" "}
            <a
              href="https://dl.acm.org/doi/epdf/10.1145/3772318.3791333"
              target="_blank"
              rel="noreferrer"
              className="border-b-0 border-black underline decoration-1 underline-offset-[3px] transition-colors hover:border-neutral-500 hover:text-neutral-500 lg:border-b lg:no-underline"
            >
              PDF
            </a>
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1680px] grid-cols-1 px-4 md:px-8 lg:min-h-0 lg:flex-1 lg:grid-cols-[320px_minmax(0,1fr)] lg:border-b lg:border-black lg:pt-4">
        <div aria-hidden="true" className="hidden lg:col-span-2 lg:block lg:border-t lg:border-black" />
        <section className="py-6 lg:col-start-2 lg:row-start-2 lg:pb-3 lg:pt-0 lg:pl-6">
          <div className="border-b border-black py-1.5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <div>
                <p className="grid grid-cols-[24px_minmax(0,1fr)] text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-500 lg:block">
                  <span className="lg:hidden">I.</span>
                  <span>Highlights</span>
                </p>
                <h1 className="mt-2 text-[30px] font-normal uppercase leading-none tracking-normal lg:text-4xl">
                  {previewProject.title}
                </h1>
              </div>
              <div className="flex justify-self-end gap-2">
                <button
                  type="button"
                  aria-label="Previous highlight"
                  onClick={() => slideHighlights(-1)}
                  className="grid h-11 w-11 place-items-center border border-black text-sm font-normal hover:bg-black hover:text-[#fbfaf7] lg:h-9 lg:w-9"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  aria-label="Next highlight"
                  onClick={() => slideHighlights(1)}
                  className="grid h-11 w-11 place-items-center border border-black text-sm font-normal hover:bg-black hover:text-[#fbfaf7] lg:h-9 lg:w-9"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>

          <div
            ref={highlightCategoryScrollerRef}
            className="mobile-category-index no-scrollbar mt-2 flex overflow-x-auto border-l border-t border-black lg:grid lg:grid-cols-4 lg:overflow-visible xl:grid-cols-7"
          >
            {categoryOrder.map((category) => (
              <button
                key={category}
                data-highlight-category={category}
                type="button"
                aria-pressed={category === activeCategory}
                aria-label={`${category}: ${highlightIndicesByCategory[category].length} highlights. Activate repeatedly to cycle through this category.`}
                onClick={() => setHighlightCategory(category)}
                className={`category-index-item ${
                  category === activeCategory
                    ? "is-active"
                    : ""
                } min-h-[76px] w-24 shrink-0 border-b border-r border-black p-1.5 text-left lg:min-h-[94px] lg:w-auto lg:shrink`}
              >
                <span aria-hidden="true" className="category-index-marker">
                  {highlightIndicesByCategory[category].map((_, index) => (
                    <span
                      key={index}
                      className={`category-index-marker-segment ${
                        category === activeCategory && index === activeCategoryPosition
                          ? "is-current"
                          : ""
                      }`}
                    />
                  ))}
                </span>
                <CategoryGlyph
                  key={`${category}-${category === activeCategory ? currentPreviewIndex : "idle"}`}
                  category={category}
                  className="category-index-icon h-10 w-full lg:h-14"
                />
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
            onWheel={() => {
              categoryCycleRef.current = null;
            }}
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
                    active={index === currentPreviewIndex}
                    wide
                    priority={index < 2}
                    onActivate={() => previewHighlight(index)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 border-t border-black py-2">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-500 lg:hidden">
              <span>{String(currentPreviewIndex + 1).padStart(2, "0")}</span>
              <div className="h-px overflow-hidden bg-neutral-300">
                <span
                  className="block h-full bg-black transition-[width] duration-300 ease-out"
                  style={{ width: `${((currentPreviewIndex + 1) / highlightProjects.length) * 100}%` }}
                />
              </div>
              <span>{String(highlightProjects.length).padStart(2, "0")}</span>
            </div>
            <div className="hidden grid-cols-[auto_1fr_auto] items-center gap-3 text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-500 lg:grid">
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
                    onClick={() => {
                      categoryCycleRef.current = null;
                      goToHighlight(index, "smooth", "settle");
                    }}
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
            <p className="mt-2 hidden text-xs font-normal uppercase tracking-[0.16em] lg:block">
              {previewProject.title}
            </p>
          </div>
        </section>

        <div aria-hidden="true" className="-mx-2 border-t border-black md:-mx-4 lg:hidden" />

        <aside className="py-6 lg:col-start-1 lg:row-start-2 lg:flex lg:min-h-0 lg:flex-col lg:border-r lg:pb-3 lg:pt-0 lg:pr-6">
          <div className="border-b border-black pb-3 pt-1.5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
              <h2 className="grid grid-cols-[24px_minmax(0,1fr)] text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-500 lg:block">
                <span className="lg:hidden">II.</span>
                <span>Daily place reading</span>
              </h2>
              <time className="text-right text-[10px] font-normal uppercase tracking-[0.16em] text-neutral-500">
                {now.toISOString().slice(0, 10)} UTC
              </time>
            </div>
            <p className="mt-3 text-[12px] leading-[1.5] tracking-[0.01em] text-neutral-600 lg:hidden">
              Taiwan and the SF Bay Area are both part of my life. Each day, we explore one place in each, noticing its environment, materials, spaces, and histories.
            </p>
            <p className="mt-3 hidden max-w-[276px] text-[12px] leading-[1.5] tracking-[0.01em] text-neutral-600 lg:block">
              Taiwan and the SF Bay Area are both part of my life. Each day, we explore one new place in each, noticing its environment, materials, spaces, and histories.
            </p>
            <p className="mt-2.5 hidden max-w-[276px] text-[10px] leading-[1.5] tracking-[0.03em] text-neutral-500 lg:block">
              Explore the images for a closer reading.
            </p>
          </div>
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
            <div className="field-note-list no-scrollbar grid auto-cols-[82%] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory min-[390px]:grid-flow-row min-[390px]:grid-cols-2 min-[390px]:overflow-visible min-[390px]:snap-none lg:block">
              {fieldNoteItems.map((note) => (
                <FieldNoteCard key={note.id} note={note} />
              ))}
              {!fieldNotesLoading
                ? fieldNoteUnavailable.map((item) => (
                    <article key={item.region} className="snap-start border-b-0 border-black py-4 lg:border-b">
                      <p className="text-[10px] font-normal uppercase tracking-[0.16em] text-neutral-500">
                        {item.region}
                      </p>
                      <p className="mt-3 max-w-[276px] text-[12px] leading-[1.5] text-neutral-600">
                        {item.message}
                      </p>
                    </article>
                  ))
                : null}
            </div>
          </div>
        </aside>

        <div aria-hidden="true" className="-mx-2 border-t border-black md:-mx-4 lg:hidden" />
      </section>

      <section id="projects-section" className="scroll-mt-24 px-4 py-6 md:px-8 lg:py-8">
        <div className="mx-auto max-w-[1680px]">
          {/* <div className="mb-6 grid py-5 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.38fr)] md:items-end">
            <div>
              <p className="text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-500">
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
          <div className="mb-6 mt-2 grid gap-4 md:grid-cols-[0.35fr_1.65fr] md:items-end lg:mb-8 lg:mt-8 lg:gap-5">
            <div>
              <p className="grid grid-cols-[24px_minmax(0,1fr)] text-xs uppercase tracking-[0.16em] text-neutral-500 lg:block">
                <span className="lg:hidden">III.</span>
                <span>Selected Work</span>
              </p>
              <h2 className="mt-2 text-4xl font-light uppercase tracking-normal md:text-6xl">
                Projects
              </h2>
            </div>

            <p className="max-w-[34rem] text-[13px] leading-[1.55] text-neutral-600 lg:hidden">
              Exploring matter, computation, and perception through research, prototyping, and making.
            </p>
            <p className="hidden max-w-none text-sm leading-6 text-neutral-600 lg:block lg:justify-self-end lg:text-right">
              Quantitative and qualitative in approach, poetic and artistic in expression, and innovative in form.<br />
              This body of work explores research, computation, material systems, and perception.
            </p>
          </div>
          <FilterBar
            categories={categories}
            active={active}
            setActive={(category) => setActive(category)}
          />

          <div className="mt-6 grid grid-cols-1 gap-x-3 gap-y-6 min-[390px]:grid-cols-2 lg:hidden">
            {mobileProjects.map((project, projectIndex) => (
              <ProjectCard
                key={project.slug}
                project={project}
                priority={projectIndex < 2}
                sizes="(max-width: 389px) calc(100vw - 32px), (max-width: 1023px) 46vw, 20vw"
              />
            ))}
          </div>

          <div className="mt-8 hidden overflow-x-auto pb-4 lg:block">
            <div
              className="grid min-w-[1380px] gap-4 2xl:min-w-0"
              style={{ gridTemplateColumns: `repeat(${projectGroups.length}, minmax(0, 1fr))` }}
            >
              {projectGroups.map((group) => {
                const isSelected = active === group.category;
                const isMuted = active !== "Show All" && !isSelected;

                return (
                  <section key={group.category} className="min-w-0 border-l border-black pl-3">
                    <div className="grid gap-4">
                      {group.projects.map((project, projectIndex) => (
                        <ProjectCard
                          key={project.slug}
                          project={project}
                          muted={isMuted}
                          priority={isSelected && projectIndex === 0}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
