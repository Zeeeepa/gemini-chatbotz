/**
 * Gemini 3 Middleware for OpenRouter
 * 
 * Handles thought_signature preservation for multi-step tool calling.
 * OpenRouter returns reasoning_details with encrypted signatures that must
 * be passed back in subsequent requests for Gemini 3 models.
 * 
 * Reference: https://openrouter.ai/docs/guides/features/tool-calling#interleaved-thinking
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ReasoningDetail {
  type: "reasoning.text" | "reasoning.summary" | "reasoning.encrypted";
  text?: string;
  summary?: string;
  data?: string;
  id?: string;
  format?: string;
  index?: number;
  signature?: string;
}

interface OpenRouterChoice {
  delta?: {
    role?: string;
    content?: string;
    reasoning_details?: ReasoningDetail[];
    tool_calls?: Array<{
      id?: string;
      index?: number;
      type?: string;
      function?: { name?: string; arguments?: string };
    }>;
  };
  message?: {
    role?: string;
    content?: string;
    reasoning_details?: ReasoningDetail[];
    tool_calls?: Array<{
      id?: string;
      index?: number;
      type?: string;
      function?: { name?: string; arguments?: string };
    }>;
  };
}

/**
 * Extract thought signature from reasoning_details
 */
function extractThoughtSignature(reasoningDetails?: ReasoningDetail[]): string | undefined {
  if (!reasoningDetails) return undefined;
  
  for (const detail of reasoningDetails) {
    if (detail.type === "reasoning.encrypted" && detail.data) {
      return detail.data;
    }
    if (detail.signature) {
      return detail.signature;
    }
  }
  return undefined;
}

/**
 * Wraps an OpenRouter model to preserve Gemini 3 thought signatures
 */
export function wrapWithGemini3Support<T extends { doGenerate: any; doStream: any }>(model: T): T {
  const originalDoGenerate = model.doGenerate.bind(model);
  const originalDoStream = model.doStream.bind(model);

  return {
    ...model,
    
    async doGenerate(options: any) {
      const result = await originalDoGenerate(options);
      
      // Extract signature from raw response if available
      if (result.rawResponse) {
        try {
          const body = await result.rawResponse.clone().json() as { choices?: OpenRouterChoice[] };
          if (body.choices?.[0]?.message?.reasoning_details) {
            const signature = extractThoughtSignature(body.choices[0].message.reasoning_details);
            if (signature && result.toolCalls) {
              // Attach signature to first tool call (for parallel, only first gets it)
              for (const toolCall of result.toolCalls) {
                if (!("signature" in toolCall)) {
                  (toolCall as Record<string, unknown>).signature = signature;
                  break;
                }
              }
            }
            // Also attach to reasoning if present
            if (signature && result.reasoning) {
              (result.reasoning as Record<string, unknown>).signature = signature;
            }
          }
        } catch {
          // Ignore parsing errors
        }
      }
      
      return result;
    },

    async doStream(options: any) {
      const result = await originalDoStream(options);
      let currentSignature: string | undefined;
      
      // Create a transform stream that injects signatures
      const transformStream = new TransformStream<any, any>({
        transform(chunk: any, controller: any) {
          // Try to extract signature from raw chunks
          if (chunk.type === "response-metadata" && chunk.rawResponse) {
            try {
              // Parse streaming response for reasoning_details
              const text = typeof chunk.rawResponse === "string" 
                ? chunk.rawResponse 
                : JSON.stringify(chunk.rawResponse);
              
              const match = text.match(/"reasoning_details":\s*(\[[\s\S]*?\])/);
              if (match) {
                const details = JSON.parse(match[1]) as ReasoningDetail[];
                currentSignature = extractThoughtSignature(details);
              }
            } catch {
              // Ignore parsing errors
            }
          }
          
          // Inject signature into tool calls
          if (chunk.type === "tool-call" && currentSignature) {
            const enhancedChunk = {
              ...chunk,
              signature: currentSignature,
            };
            controller.enqueue(enhancedChunk);
            return;
          }
          
          // Inject signature into reasoning
          if (chunk.type === "reasoning" && currentSignature) {
            const enhancedChunk = {
              ...chunk,
              signature: currentSignature,
            };
            controller.enqueue(enhancedChunk);
            return;
          }
          
          controller.enqueue(chunk);
        },
      });

      return {
        ...result,
        stream: result.stream.pipeThrough(transformStream),
      };
    },
  };
}

/**
 * Check if a model ID is a Gemini 3 model that needs signature handling
 */
export function isGemini3Model(modelId: string): boolean {
  return modelId.includes("gemini-3");
}
