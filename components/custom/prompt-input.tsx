"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Camera,
  ChevronDown,
  FileText,
  Lightbulb,
  Loader2,
  MousePointer2,
  Plug,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { OPENROUTER_MODELS, type OpenRouterModelId, type ModelDefinition } from "@/lib/ai/openrouter";
import { useArtifact } from "@/hooks/use-artifact";

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

// Group models by provider
function getModelsByProvider(): { provider: string; models: ModelDefinition[] }[] {
  const grouped = OPENROUTER_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, ModelDefinition[]>);

  return Object.entries(grouped).map(([provider, models]) => ({
    provider,
    models,
  }));
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <title>Sparkle</title>
      <path d="M12 2L13.09 8.26L18 6L15.74 10.91L22 12L15.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L8.26 13.09L2 12L8.26 10.91L6 6L10.91 8.26L12 2Z" />
    </svg>
  );
}

function RichTextEditor({
  placeholder = "Plan, @ for context, ...",
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
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const { openArtifact } = useArtifact();

  const isEmpty = value.trim().length === 0;
  const modelsByProvider = useMemo(() => getModelsByProvider(), []);

  const currentModel = useMemo(() => {
    return OPENROUTER_MODELS.find((m) => m.id === selectedModel);
  }, [selectedModel]);

  const handleInput = useCallback(() => {
    if (contentEditableRef.current) {
      const text = contentEditableRef.current.innerText;
      onChange(text === "\n" ? "" : text);
    }
  }, [onChange]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (isPending) return;

      if (isStreaming) {
        onStop?.();
        return;
      }

      let currentMessage = value;
      if (contentEditableRef.current) {
        const text = contentEditableRef.current.innerText;
        currentMessage = text === "\n" ? "" : text;
        if (currentMessage !== value) {
          onChange(currentMessage);
        }
      }

      onSubmit(currentMessage, attachments.length > 0 ? attachments : undefined);
      setAttachments([]);

      // Clear the contentEditable
      if (contentEditableRef.current) {
        contentEditableRef.current.textContent = "";
      }
    },
    [attachments, isPending, isStreaming, onChange, onStop, onSubmit, value]
  );

  useEffect(() => {
    if (contentEditableRef.current && value === "") {
      if (contentEditableRef.current.textContent) {
        queueMicrotask(() => {
          if (contentEditableRef.current) {
            contentEditableRef.current.textContent = "";
          }
        });
      }
    }
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
    e.target.value = "";
  }, []);

  // Open empty code artifact (cursor-like behavior)
  const handleCursorClick = useCallback(() => {
    openArtifact({
      documentId: `code-${Date.now()}`,
      title: "New Code",
      kind: "code",
      content: "// Start typing your code here...\n",
      language: "typescript",
      messageId: "",
      status: "idle",
    });
  }, [openArtifact]);

  // Open empty document artifact
  const handleDocumentClick = useCallback(() => {
    openArtifact({
      documentId: `doc-${Date.now()}`,
      title: "New Document",
      kind: "text",
      content: "",
      messageId: "",
      status: "idle",
    });
  }, [openArtifact]);

  useEffect(() => {
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (contentEditableRef.current?.contains(target)) {
        contentEditableRef.current.focus();
      }
    };
    const wrapper = contentEditableRef.current?.closest('[role="presentation"]');
    if (wrapper) {
      wrapper.addEventListener("click", handleClick);
      return () => wrapper.removeEventListener("click", handleClick);
    }
  }, []);

  const pillButtonClass =
    "inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent focus:outline-none";

  return (
    <div className="mx-auto flex w-full flex-col px-4 lg:max-w-[600px] xl:px-0">
      <form className="flex w-full flex-col" onSubmit={handleSubmit}>
        <div
          className={cn(
            "rounded-2xl border border-border bg-background transition-all shadow-sm",
            isFocused && "ring-2 ring-ring",
            isDisabled && "opacity-60"
          )}
        >
          <div role="presentation" className="relative cursor-text overflow-hidden">
            <input
              ref={fileInputRef}
              accept="image/*,.jpeg,.jpg,.png,.webp,.svg,.pdf,application/pdf"
              multiple
              type="file"
              tabIndex={-1}
              onChange={handleFileChange}
              title="Attach files"
              aria-label="Attach files"
              className="absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]"
            />
            <div className="flex flex-col">
              <div className="relative min-h-[44px] w-full px-4 py-3">
                {isEmpty && (
                  <span className="pointer-events-none absolute left-4 top-3 text-[15px] text-muted-foreground">
                    {placeholder}
                  </span>
                )}
                <div
                  ref={contentEditableRef}
                  contentEditable={!isDisabled}
                  role="textbox"
                  tabIndex={isDisabled ? -1 : 0}
                  aria-label="Message input"
                  title="Type your message here"
                  translate="no"
                  className="relative min-h-[20px] whitespace-pre-wrap break-words text-[15px] text-foreground outline-none"
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  suppressContentEditableWarning
                />
              </div>

              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 pb-2">
                  {attachments.map((file) => (
                    <Badge key={`${file.name}-${file.size}-${file.lastModified}`} variant="secondary" className="gap-1">
                      {file.name}
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((f) => f !== file))}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between px-3 pb-2.5">
                <div className="flex items-center gap-2">
                  {/* Model Selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className={pillButtonClass} disabled={isDisabled}>
                        <SparkleIcon className="h-4 w-4" />
                        <span className="max-w-[150px] truncate">
                          {currentModel?.name || "Select model"}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
                      {modelsByProvider.map((group, idx) => (
                        <div key={group.provider}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {group.provider}
                          </div>
                          {group.models.map((model) => (
                            <DropdownMenuItem
                              key={model.id}
                              onClick={() => onSelectModel?.(model.id)}
                              className={cn(
                                "pl-4",
                                selectedModel === model.id && "bg-accent"
                              )}
                            >
                              <span className="truncate">{model.name}</span>
                            </DropdownMenuItem>
                          ))}
                          {idx < modelsByProvider.length - 1 && <DropdownMenuSeparator />}
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Options Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className={pillButtonClass} disabled={isDisabled}>
                        <Settings className="h-4 w-4" />
                        <span>Options</span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Plug className="mr-2 h-4 w-4" />
                        MCP Connections
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          setReasoningEnabled(!reasoningEnabled);
                        }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Lightbulb className="mr-2 h-4 w-4" />
                          Reasoning
                        </div>
                        <div
                          className={cn(
                            "h-4 w-8 rounded-full transition-colors",
                            reasoningEnabled ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <div
                            className={cn(
                              "h-4 w-4 rounded-full bg-background shadow transition-transform",
                              reasoningEnabled && "translate-x-4"
                            )}
                          />
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-1">
                  {/* Cursor/Code Button - Opens Code Artifact */}
                  <button
                    type="button"
                    onClick={handleCursorClick}
                    title="New Code"
                    aria-label="New Code"
                    disabled={isDisabled}
                    className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus:outline-none disabled:opacity-50"
                  >
                    <MousePointer2 className="h-[18px] w-[18px]" />
                  </button>

                  {/* Document Button - Opens Document Artifact */}
                  <button
                    type="button"
                    onClick={handleDocumentClick}
                    title="New Document"
                    aria-label="New Document"
                    disabled={isDisabled}
                    className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus:outline-none disabled:opacity-50"
                  >
                    <FileText className="h-[18px] w-[18px]" />
                  </button>

                  {/* Camera/Image Button */}
                  <button
                    type="button"
                    onClick={handleImageClick}
                    title="Attach Image"
                    aria-label="Attach Image"
                    disabled={isDisabled}
                    className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus:outline-none disabled:opacity-50"
                  >
                    <Camera className="h-[18px] w-[18px]" />
                  </button>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isDisabled || (!isStreaming && isEmpty)}
                    title={isStreaming ? "Stop" : "Submit"}
                    aria-label={isStreaming ? "Stop" : "Submit"}
                    className={cn(
                      "ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed",
                      isEmpty && !isStreaming
                        ? "bg-muted text-muted-foreground"
                        : isStreaming
                          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isStreaming ? (
                      <span className="h-3 w-3 rounded-sm bg-current" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export const PromptInput = ({
  onSubmit,
  onStop,
  isLoading = false,
  isStreaming = false,
  placeholder = "Plan, @ for context, ...",
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
