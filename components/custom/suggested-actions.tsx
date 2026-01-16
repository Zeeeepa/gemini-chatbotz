"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Code2Icon,
  GraduationCapIcon,
  PenLineIcon,
  SparklesIcon,
  PlaneIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps } from "react";

// Suggestion button component
type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = "outline",
  size = "sm",
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = () => {
    onClick?.(suggestion);
  };

  return (
    <Button
      className={cn("cursor-pointer rounded-full px-4", className)}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children || suggestion}
    </Button>
  );
};

// Horizontal scroll container for suggestions
type SuggestionsContainerProps = ComponentProps<typeof ScrollArea>;

const SuggestionsContainer = ({
  className,
  children,
  ...props
}: SuggestionsContainerProps) => (
  <ScrollArea className="w-full overflow-x-auto whitespace-nowrap" {...props}>
    <div className={cn("flex w-max flex-nowrap items-center gap-2", className)}>
      {children}
    </div>
    <ScrollBar className="hidden" orientation="horizontal" />
  </ScrollArea>
);

// Category definitions
const categories = [
  {
    id: "write",
    label: "Write",
    icon: PenLineIcon,
    prompts: [
      "Write a concise email to reschedule a meeting",
      "Turn these bullet points into a clear memo",
      "Rewrite this paragraph to be more direct",
      "Draft a blog post outline about this topic",
      "Brainstorm 10 headline ideas for this",
    ],
  },
  {
    id: "learn",
    label: "Learn",
    icon: GraduationCapIcon,
    prompts: [
      "Explain this concept like I'm smart but new to it",
      "Quiz me on this topic (start easy, ramp up)",
      "Give me a mental model + common pitfalls",
      "Summarize this in 5 bullets + 3 key takeaways",
      "Compare these two approaches and when to use each",
    ],
  },
  {
    id: "code",
    label: "Code",
    icon: Code2Icon,
    prompts: [
      "Implement this feature and explain tradeoffs",
      "Find the bug in this snippet and fix it",
      "Refactor this for readability + performance",
      "Write tests for this module (edge cases too)",
      "Design a clean API for this requirement",
    ],
  },
  {
    id: "travel",
    label: "Travel",
    icon: PlaneIcon,
    prompts: [
      "Find flights from NYC to LA next weekend",
      "Plan a 5-day trip to Tokyo on a budget",
      "What's the best time to visit Barcelona?",
      "Compare hotel options near Central Park",
      "Create an itinerary for a road trip",
    ],
  },
  {
    id: "life",
    label: "Life stuff",
    icon: SparklesIcon,
    prompts: [
      "Plan a simple healthy meal prep for the week",
      "Help me choose between these options (pros/cons)",
      "Create a 30-minute daily routine I'll stick to",
      "Write a message to resolve a conflict calmly",
      "Suggest a weekend plan based on my constraints",
    ],
  },
] as const;

type CategoryId = (typeof categories)[number]["id"];

type SuggestedActionsProps = {
  onSendPrompt: (prompt: string) => void;
  className?: string;
};

function PureSuggestedActions({
  onSendPrompt,
  className,
}: SuggestedActionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryId | null>(null);

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  // Click outside to close
  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSelectedCategoryId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedCategoryId]);

  const handlePromptClick = (prompt: string) => {
    setSelectedCategoryId(null);
    onSendPrompt(prompt);
  };

  return (
    <div
      className={cn("relative flex w-full flex-col", className)}
      ref={containerRef}
    >
      <SuggestionsContainer className="mx-auto gap-1.5">
        {categories.map((c, index) => {
          const Icon = c.icon;
          const selected = c.id === selectedCategoryId;

          return (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              initial={{ opacity: 0, y: 6 }}
              key={c.id}
              transition={{ delay: 0.03 * index }}
            >
              <Suggestion
                aria-pressed={selected}
                className={cn(
                  "gap-2 border-chocolate-200 dark:border-chocolate-700 hover:bg-chocolate-100 dark:hover:bg-chocolate-800",
                  selected &&
                    "border-chocolate-500 bg-chocolate-500 text-white hover:bg-chocolate-600 dark:bg-chocolate-600 dark:hover:bg-chocolate-500"
                )}
                onClick={() =>
                  setSelectedCategoryId((prev) =>
                    prev === c.id ? null : c.id
                  )
                }
                suggestion={c.label}
                variant={selected ? "default" : "outline"}
              >
                <Icon className="size-4" />
                <span className="sm:inline hidden">{c.label}</span>
              </Suggestion>
            </motion.div>
          );
        })}
      </SuggestionsContainer>

      {selectedCategory ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="absolute start-0 top-full z-20 w-full pt-2"
          initial={{ opacity: 0, y: 6 }}
          key={selectedCategory.id}
          transition={{ duration: 0.15 }}
        >
          <div className="w-full rounded-xl border border-chocolate-200 dark:border-chocolate-700 bg-background p-2 shadow-lg">
            <div className="flex w-full flex-col">
              {selectedCategory.prompts.map((prompt, index) => (
                <div className="w-full" key={prompt}>
                  <Button
                    className="h-auto w-full justify-start whitespace-pre-wrap rounded-lg px-3 py-2 text-left text-sm hover:bg-chocolate-100 dark:hover:bg-chocolate-800"
                    onClick={() => handlePromptClick(prompt)}
                    type="button"
                    variant="ghost"
                  >
                    {prompt}
                  </Button>
                  {index < selectedCategory.prompts.length - 1 ? (
                    <Separator className="my-1 bg-chocolate-100 dark:bg-chocolate-800" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions);
