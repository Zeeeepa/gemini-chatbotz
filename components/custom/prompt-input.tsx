"use client";

import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  AudioWaveform,
  ChevronDown,
  Loader2,
  Paperclip,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { OPENROUTER_MODELS, type OpenRouterModelId } from "@/lib/ai/openrouter";

type PromptInputProps = {
  onSubmit: (value: string, attachments?: File[], modelId?: OpenRouterModelId) => void;
  onStop?: () => void;
  isLoading?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  className?: string;
  selectedModel?: OpenRouterModelId;
  onModelChange?: (modelId: OpenRouterModelId) => void;
};

type RichTextEditorProps = {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message?: string, attachments?: File[]) => void;
  selectedModel?: OpenRouterModelId;
  onSelectModel?: (model: OpenRouterModelId) => void;
  isDisabled?: boolean;
  isPending?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
};

function RichTextEditor({
  placeholder = "Build features, fix bugs, and understand codebases...",
  value,
  onChange,
  onSubmit,
  selectedModel,
  onSelectModel,
  isDisabled = false,
  isPending = false,
  isStreaming = false,
  onStop,
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const isEmpty = value.trim().length === 0;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (isPending) return;

      if (isStreaming) {
        onStop?.();
        return;
      }

      onSubmit(value, attachments.length > 0 ? attachments : undefined);
      setAttachments([]);
    },
    [attachments, isPending, isStreaming, onStop, onSubmit, value]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit]
  );

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
    e.target.value = "";
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full" role="presentation">
      <div
        className={cn(
          "w-full rounded-3xl border bg-background p-3 shadow-sm",
          isFocused && "ring-2 ring-ring",
          isDisabled && "opacity-60"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="relative w-full">
            {isEmpty && (
              <div className="pointer-events-none absolute left-0 top-0 select-none text-muted-foreground">
                {placeholder}
              </div>
            )}
            <textarea
              className={cn(
                "min-h-[80px] w-full resize-none whitespace-pre-wrap break-words bg-transparent outline-none",
                isDisabled && "pointer-events-none"
              )}
              value={value}
              onChange={(e) => onChange(e.target.value === "\n" ? "" : e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              aria-label="Prompt"
              disabled={isDisabled}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-all hover:bg-[hsl(240,6%,93%)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                disabled={isDisabled}
              >
                <Sparkles className="h-4 w-4" />
                {useMemo(() => {
                  if (!selectedModel) return "Select model";
                  return OPENROUTER_MODELS.find((m) => m.id === selectedModel)?.name ?? selectedModel;
                }, [selectedModel])}
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {OPENROUTER_MODELS.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onSelect={() => onSelectModel?.(model.id)}
                    className={cn(selectedModel === model.id && "bg-accent")}
                  >
                    {model.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {attachments.length > 0 && (
              <Badge variant="secondary">{attachments.length} file(s)</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-all hover:bg-[hsl(240,6%,93%)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              disabled={isDisabled}
              aria-label="Audio"
            >
              <AudioWaveform className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleAttachClick}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-all hover:bg-[hsl(240,6%,93%)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              disabled={isDisabled}
              aria-label="Attach"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <button
              type="submit"
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                isStreaming && "bg-destructive hover:bg-destructive/90"
              )}
              disabled={isDisabled || (!isStreaming && isEmpty)}
              aria-label={isStreaming ? "Stop" : "Build"}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isStreaming ? (
                <span className="text-xs font-semibold">Stop</span>
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {!isStreaming ? "Build" : "Stop"}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFileChange}
        accept=".pdf,application/pdf,image/png,image/jpeg,image/gif,image/webp"
        aria-label="Upload files"
      />
    </form>
  );
}

export const PromptInput = ({
  onSubmit,
  onStop,
  isLoading = false,
  isStreaming = false,
  placeholder = "Describe your idea",
  className = "",
  selectedModel = "anthropic/claude-3.5-sonnet",
  onModelChange,
}: PromptInputProps) => {
  const [value, setValue] = useState("");

  const handleSelectModel = useCallback(
    (modelId: OpenRouterModelId) => {
      onModelChange?.(modelId);
    },
    [onModelChange]
  );

  const handleSubmit = useCallback(
    (message?: string, attachments?: File[]) => {
      const trimmed = (message ?? "").trim();
      if (!trimmed && (!attachments || attachments.length === 0)) return;
      if (isLoading) return;
      onSubmit(trimmed, attachments, selectedModel);
      setValue("");
    },
    [isLoading, onSubmit, selectedModel]
  );

  return (
    <div className={cn("w-full", className)}>
      <RichTextEditor
        placeholder={placeholder}
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        isDisabled={isLoading}
        isPending={isLoading}
        isStreaming={isStreaming}
        onStop={onStop}
      />
    </div>
  );
};
