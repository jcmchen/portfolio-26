"use client";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 1 }}   // 從下方輕微滑入 + 透明
        animate={{ opacity: 1, y: 0 }}    // 回到正常位置 + 顯示
        transition={{
          delay: 0.25,                    // 短暫停頓，避免突兀
          duration: 0.8,                  // 時長稍長，更柔和
        //   ease: [0.16, 1, 0.3, 1],        // easeOutQuart：先快後慢
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
