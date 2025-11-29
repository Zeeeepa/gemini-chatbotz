"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThinkingMessage({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 px-4 py-3 max-w-[600px]",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="flex items-center gap-1.5">
        <motion.div
          className="size-2 rounded-full bg-chocolate-500"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: 0,
          }}
        />
        <motion.div
          className="size-2 rounded-full bg-chocolate-500"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: 0.2,
          }}
        />
        <motion.div
          className="size-2 rounded-full bg-chocolate-500"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: 0.4,
          }}
        />
      </div>
      <span className="text-sm text-muted-foreground">Thinking...</span>
    </motion.div>
  );
}

export function StreamingIndicator({ className }: { className?: string }) {
  return (
    <motion.span
      className={cn(
        "inline-block w-2 h-4 bg-chocolate-500 rounded-sm ml-0.5",
        className
      )}
      animate={{ opacity: [1, 0] }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
