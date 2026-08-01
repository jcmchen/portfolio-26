export type Project = {
  slug: string;
  title: string;
  year: string | number;
  category: string;
  thumbnail: string;
  cover: string;
  thumbnailPosition?: string;
  coverPosition?: string;
  label?: string;
  resources?: Array<{
    text: string;
    href: string;
  }>;
};

export const projects: Project[] = [
  {
    slug: "hygrometric",
    title: "Hygrometric",
    year: 2026,
    category: "Nature",
    thumbnail: "/images/hygrometric/cover_long.jpg",
    cover: "/images/hygrometric/cover_long.jpg",
    label: "Computational framework for hygromorphic shape-morphing.",
    resources: [
      { text: "DOI", href: "https://dl.acm.org/doi/10.1145/3772318.3791333" },
      { text: "PDF", href: "https://dl.acm.org/doi/epdf/10.1145/3772318.3791333" },
    ],
  },
  { slug: "micro-macro", title: "Micro Macro", year: "2019-2020", category: "Perception", thumbnail: "/images/DSC_9100-c.jpg", cover: "/images/DSC_9100-c.jpg", label: "Scale shifts, perception, and spatial ambiguity." },
  { slug: "bridges", title: "Bridges", year: "2017-2018", category: "Construction / Fabrication", thumbnail: "/images/CNV000021-ed.jpg", cover: "/images/CNV000021-ed.jpg" },
  { slug: "form-force-matter", title: "Form Force Matter", year: 2021, category: "Construction / Fabrication", thumbnail: "/images/DSC_9959_ed.jpg", cover: "/images/DSC_9959_ed.jpg" },
  { slug: "resource-rush", title: "Resource Rush", year: 2023, category: "Robotics", thumbnail: "/images/resource-main.png", cover: "/images/resource-main.png" },
  { slug: "hanger-games", title: "Hanger Games", year: 2019, category: "Construction / Fabrication", thumbnail: "/images/sss19-00-ps-ai-bg.png", cover: "/images/sss19-00-ps-ai-bg.png" },
  { slug: "slime-spring-structure", title: "Slime Spring Structure", year: 2018, category: "Construction / Fabrication", thumbnail: "/images/sss18-01-c-ai-bg.png", cover: "/images/sss18-01-c-ai-bg.png" },
  { slug: "interlace", title: "Interlace", year: 2018, category: "Construction / Fabrication", thumbnail: "/images/IMG_1259-ed.jpg", cover: "/images/IMG_1259-ed.jpg" },
  { slug: "bridge-x", title: "Bridge X", year: 2021, category: "Construction / Fabrication", thumbnail: "/images/bridge-x_300ppi.png", cover: "/images/bridge-x_300ppi.png" },
  { slug: "fold-and-cut", title: "Fold & Cut", year: 2017, category: "Perception", thumbnail: "/images/DSC_3370-ed.jpg", cover: "/images/DSC_3370-ed.jpg" },
  { slug: "illustrations", title: "Illustrations", year: "2019-2021", category: "Perception", thumbnail: "/images/DSC_8999-PS3_BW-c.jpg", cover: "/images/DSC_8999-PS3_BW-c.jpg" },
  { slug: "sacred-light", title: "Sacred Light", year: 2020, category: "Perception", thumbnail: "/images/IMG_5087_BW-c.jpg", cover: "/images/IMG_5087_BW-c.jpg" },
  { slug: "unidentified-funicular-objects", title: "Unidentified Funicular Objects", year: "2017", category: "Construction / Fabrication", thumbnail: "/images/IMG_0003-ed.jpg", cover: "/images/IMG_0003-ed.jpg" },
  {
    slug: "moment-cube",
    title: "MomentCube",
    year: 2022,
    category: "New Media",
    thumbnail: "/images/moment-cube/DSC08012_REDUCED.jpg",
    cover: "/images/moment-cube/DSC08012_REDUCED.jpg",
    resources: [
      {
        text: "Full Report",
        href: "https://drive.google.com/file/d/1IWg_7bU3prEHDrfwdtIan9II6ElAlk5S/view?usp=share_link",
      },
    ],
  },
  { slug: "yuan", title: "Yuan", year: 2023, category: "Perception", thumbnail: "/images/portfolio/p_Page_38.png", cover: "/images/portfolio/p_Page_38.png" },
  { slug: "task-and-motion-planning", title: "Task and Motion Planning for Robotic Assembly", year: 2023, category: "Robotics", thumbnail: "/images/chair/0160.png", cover: "/images/chair/animate_200_p01.gif" },
  { slug: "the-nature-of-growth", title: "The Nature of Growth", year: 2019, category: "Nature", thumbnail: "/images/Tree%2001-c.jpeg", cover: "/images/Tree%2001-c.jpeg" },
  { slug: "mobility-and-housing-taipei", title: "Mobility and Housing in Taipei", year: 2024, category: "Visualization", thumbnail: "/images/housing01.png", cover: "/images/housing01.png" },
  { slug: "bio-inspired-composite", title: "Bio-Inspired Composite Materials", year: 2019, category: "Nature", thumbnail: "/images/BICM-00.png", cover: "/images/BICM-00.png" },
  { slug: "botani-plan", title: "Botani Plan: Second Nature", year: 2020, category: "Nature", thumbnail: "/images/DSC_8958-c.jpg", cover: "/images/DSC_8958-c.jpg" },
  { slug: "floating-structures", title: "Floating Structures", year: "2019-2020", category: "Nature", thumbnail: "/images/IMG_8809-c2.png", cover: "/images/IMG_8809-c2.png" },
  { slug: "tangi-growth", title: "TangiGrowth", year: 2022, category: "New Media", thumbnail: "/images/TUI/Tangi05-ed.jpg", cover: "/images/TUI/Tangi05-ed.jpg" },
  { slug: "our-grandmas-fridge", title: "Our Grandma's Fridge", year: 2023, category: "New Media", thumbnail: "/images/fridge/ogf_mol_2024.png", cover: "/images/fridge/ogf_mol_2024.png" },
  { slug: "capacitive-salad", title: "Capacitive Salad", year: 2022, category: "New Media", thumbnail: "/images/TUI/salad-ed.png", cover: "/images/TUI/salad-ed.png" },
  { slug: "seeds-starter-kit", title: "Seeds Starter Kit", year: 2023, category: "Nature", thumbnail: "/images/Seed/DSC_7539_bright_02-c3.jpeg", cover: "/images/Seed/DSC_7539_bright_02-c3.jpeg" },
  { slug: "computer-graphics-imaging", title: "Computer Graphics and Imaging", year: 2024, category: "Visualization", thumbnail: "/images/cg/cg02.png", cover: "/images/cg/cg02.png" },
  { slug: "recycled-crawler", title: "Recycled Crawler", year: 2022, category: "New Media", thumbnail: "/images/TUI/DSC_6518_ED.jpg", cover: "/images/TUI/DSC_6518_ED.jpg" },
  { slug: "granola-cuckoo-clock", title: "Granola Cuckoo Clock", year: 2022, category: "New Media", thumbnail: "/images/TUI/DSC_6529_ED.jpg", cover: "/images/TUI/DSC_6529_ED.jpg" },
  { slug: "the-rotary-vagary", title: "The Rotary Vagary", year: 2023, category: "Building", thumbnail: "/images/1.png", cover: "/images/1.png" },
  { slug: "assembled-living", title: "Assembled Living", year: 2022, category: "Building", thumbnail: "/images/DSC_7022-c.jpg", cover: "/images/DSC_7022-c.jpg" },
  { slug: "boolean-auditorium", title: "Boolean Auditorium", year: 2022, category: "Building", thumbnail: "/images/boolean-auditorium/0425_R_Ext_3200_level light 1.42.jpg", cover: "/images/boolean-auditorium/0425_R_Ext_3200_level light 1.42.jpg" },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
