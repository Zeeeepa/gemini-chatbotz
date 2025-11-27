"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { memo } from "react";
import { Streamdown } from "streamdown";

import { BotIcon, UserIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import { ToolView } from "./tool-views";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "../ai-elements/reasoning";
import { StreamingIndicator } from "../ai-elements/thinking-message";

// Types for attachments and tool invocations
interface MessageAttachment {
  url: string;
  name?: string;
  contentType?: string;
}

interface MessageToolInvocation {
  type?: "tool-invocation";
  toolName: string;
  toolCallId: string;
  state: string;
  args?: Record<string, unknown>;
  result?: unknown;
}

function getToolStatus(state: string): "pending" | "running" | "complete" | "error" {
  switch (state) {
    case "result":
      return "complete";
    case "call":
    case "partial-call":
      return "running";
    default:
      return "pending";
  }
}

export const Message = memo(({
  role,
  content,
  toolInvocations,
  attachments,
  reasoning,
  isStreaming = false,
}: {
  chatId?: string;
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<MessageToolInvocation> | undefined;
  attachments?: Array<MessageAttachment>;
  reasoning?: string;
  isStreaming?: boolean;
}) => {
  return (
    <motion.div
      className={`flex flex-row gap-4 px-4 w-full md:w-[600px] md:px-0 first-of-type:pt-20`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
        {role === "assistant" ? <BotIcon /> : <UserIcon />}
      </div>

      <div className="flex flex-col gap-2 w-full">
        {/* Reasoning/Thinking section */}
        {reasoning && (
          <Reasoning isStreaming={isStreaming} defaultOpen={isStreaming}>
            <ReasoningTrigger />
            <ReasoningContent>{reasoning}</ReasoningContent>
          </Reasoning>
        )}

        {/* Main content with streaming support */}
        {content && typeof content === "string" && (
          <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4 prose prose-sm dark:prose-invert max-w-none">
            <Streamdown>{content}</Streamdown>
            {isStreaming && <StreamingIndicator />}
          </div>
        )}

        {/* Tool invocations */}
        {toolInvocations && toolInvocations.length > 0 && (
          <div className="flex flex-col gap-4">
            {toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;
              const status = getToolStatus(state);
              const args = (toolInvocation as any).args || {};
              const result = state === "result" ? (toolInvocation as any).result : undefined;

              return (
                <ToolView
                  key={toolCallId}
                  toolName={toolName}
                  args={args}
                  result={result}
                  status={status}
                />
              );
            })}
          </div>
        )}

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-row gap-2">
            {attachments.map((attachment) => (
              <PreviewAttachment key={attachment.url} attachment={attachment} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});
