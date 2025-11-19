import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

type FullscreenLoaderProps = {
  show: boolean;
  className?: string;
};

export function FullscreenLoader({ show, className }: FullscreenLoaderProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "fixed inset-0 z-[1000] flex items-center justify-center",
            "bg-background",
            className
          )}
        >
          <WaveAnimation />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function WaveAnimation() {
  const bars = [0, 1, 2, 3, 4, 5, 6];
  return (
    <div className="flex items-end gap-2">
      {bars.map((i) => (
        <motion.span
          key={i}
          className="w-3 rounded-full"
          style={{ backgroundColor: "#87D8CD" }}
          initial={{ height: 12, opacity: 0.9 }}
          animate={{ height: [12, 40, 72, 40, 12], opacity: [0.9, 1, 1, 1, 0.9] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.08,
          }}
        />
      ))}
    </div>
  );
}
