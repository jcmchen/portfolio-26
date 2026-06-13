// "use client";

// type FilterBarProps = {
//   categories: { name: string; count: number }[];
//   active: string;
//   setActive: (category: string) => void;
// };

// export default function FilterBar({ categories, active, setActive }: FilterBarProps) {
//   return (
//     <div className="flex flex-wrap items-center gap-4 text-sm mb-8">
//       {categories.map((cat) => (
//         <button
//           key={cat.name}
//           onClick={() => setActive(cat.name)}
//           className={`${
//             active === cat.name ? "underline font-medium" : "text-gray-600 hover:text-black"
//           }`}
//         >
//           {cat.name}
//           <span className="ml-1 text-gray-400">{cat.count}</span>
//         </button>
//       ))}
//     </div>
//   );
// }

"use client";

type FilterBarProps = {
  categories: { name: string; count: number }[];
  active: string;
  setActive: (category: string) => void;
};

export default function FilterBar({ categories, active, setActive }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-black py-4 text-xs uppercase tracking-[0.12em] md:gap-x-8">
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => setActive(cat.name)}
          className={`group relative flex items-baseline gap-1 border-b transition-colors ${
            active === cat.name
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:border-neutral-400 hover:text-black"
          }`}
        >
          <span>{cat.name}</span>
          <span className="text-[10px] text-neutral-400">{cat.count}</span>
        </button>
      ))}
    </div>
  );
}

