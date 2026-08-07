"use client";

type FilterBarProps = {
  categories: { name: string; count: number }[];
  active: string;
  setActive: (category: string) => void;
};

export default function FilterBar({ categories, active, setActive }: FilterBarProps) {
  return (
    <div className="no-scrollbar flex flex-nowrap items-center gap-x-8 overflow-x-auto whitespace-nowrap border-y border-black py-1 text-xs uppercase tracking-[0.12em] lg:flex-wrap lg:gap-y-3 lg:overflow-visible lg:whitespace-normal lg:py-4">
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => setActive(cat.name)}
          className={`group relative flex min-h-11 shrink-0 items-center gap-1.5 border-b border-transparent transition-colors lg:min-h-0 lg:gap-1 ${
            active === cat.name
              ? "text-black lg:border-black"
              : "text-neutral-500 hover:text-black lg:hover:border-neutral-400"
          }`}
        >
          <span
            className={
              active === cat.name
                ? "underline decoration-1 underline-offset-[3px] lg:no-underline"
                : ""
            }
          >
            {cat.name}
          </span>
          <span className="text-[10px] text-neutral-400">{cat.count}</span>
        </button>
      ))}
    </div>
  );
}
