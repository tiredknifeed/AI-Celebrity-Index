"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/** Subtle depth: content drifts slower than the page as you scroll. */
export default function Parallax({ children, className, strength = 80 }: { children: React.ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, strength]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.04]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y, scale }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
