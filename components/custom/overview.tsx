import { motion } from "framer-motion";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-[500px] mx-auto"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="border-none bg-muted/50 rounded-2xl p-6 flex flex-col gap-4 text-chocolate-500 text-sm dark:text-chocolate-400 dark:border-chocolate-700">
        <p className="flex flex-row justify-center gap-4 items-center text-chocolate-900 dark:text-chocolate-50">
          <span className="text-2xl font-bold bg-gradient-to-r from-chocolate-600 to-chocolate-800 bg-clip-text text-transparent">
            Opulent
          </span>
        </p>
        <p>
          Your intelligent AI assistant powered by advanced language models. 
          Ask questions, generate code, create documents, search the web, 
          book flights, and more.
        </p>
        <p>
          Start a conversation below to explore what Opulent can do for you.
        </p>
      </div>
    </motion.div>
  );
};
