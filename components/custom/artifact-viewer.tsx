"use client";

import React, { useState } from "react";
import { Copy, Check, Download, Maximize2, Minimize2, FileCode, FileText, Table } from "lucide-react";
import { cn } from "@/lib/utils";

export type ArtifactKind = "text" | "code" | "sheet";

export interface Artifact {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  language?: string;
}

interface ArtifactViewerProps {
  artifact: Artifact;
  className?: string;
  onClose?: () => void;
}

function getLanguageFromTitle(title: string): string {
  const extension = title.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    cpp: "cpp",
    c: "c",
    cs: "csharp",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    sql: "sql",
    sh: "bash",
    yml: "yaml",
    yaml: "yaml",
    json: "json",
    xml: "xml",
    html: "html",
    css: "css",
    scss: "scss",
    md: "markdown",
  };
  return languageMap[extension || ""] || "text";
}

function KindIcon({ kind }: { kind: ArtifactKind }) {
  switch (kind) {
    case "code":
      return <FileCode className="w-4 h-4" />;
    case "sheet":
      return <Table className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
}

export function ArtifactViewer({ artifact, className, onClose }: ArtifactViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const language = artifact.language || getLanguageFromTitle(artifact.title);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-chocolate-200 dark:border-chocolate-700 bg-white dark:bg-chocolate-950 shadow-sm overflow-hidden",
        isExpanded && "fixed inset-4 z-50",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-chocolate-100 dark:border-chocolate-800 bg-chocolate-50/50 dark:bg-chocolate-900/50">
        <div className="flex items-center gap-2">
          <KindIcon kind={artifact.kind} />
          <span className="text-sm font-medium text-neutral-900 dark:text-white">{artifact.title}</span>
          {artifact.kind === "code" && (
            <span className="px-2 py-0.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-chocolate-100 dark:bg-chocolate-800 rounded-md">
              {language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-chocolate-100 dark:hover:bg-chocolate-800 rounded-lg transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-chocolate-100 dark:hover:bg-chocolate-800 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-chocolate-100 dark:hover:bg-chocolate-800 rounded-lg transition-colors"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-chocolate-100 dark:hover:bg-chocolate-800 rounded-lg transition-colors"
              title="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className={cn("overflow-auto", isExpanded ? "h-[calc(100%-48px)]" : "max-h-[500px]")}>
        {artifact.kind === "code" ? (
          <pre className="p-4 text-sm font-mono text-neutral-900 dark:text-white bg-chocolate-50 dark:bg-chocolate-900 overflow-x-auto">
            <code>{artifact.content}</code>
          </pre>
        ) : artifact.kind === "sheet" ? (
          <div className="p-4">
            <SheetRenderer content={artifact.content} />
          </div>
        ) : (
          <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
            <pre className="whitespace-pre-wrap font-sans text-neutral-900 dark:text-white">{artifact.content}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

function SheetRenderer({ content }: { content: string }) {
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return <p className="text-neutral-600 dark:text-neutral-400">Empty spreadsheet</p>;
  const rows = lines.map((line) => line.split(",").map((cell) => cell.trim()));
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-chocolate-200 dark:divide-chocolate-700 border border-chocolate-200 dark:border-chocolate-700 rounded-lg">
        <thead className="bg-chocolate-50 dark:bg-chocolate-900">
          <tr>
            {rows[0]?.map((cell, i) => (
              <th
                key={i}
                className="px-4 py-2 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider border-r border-chocolate-200 dark:border-chocolate-700 last:border-r-0"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-chocolate-950 divide-y divide-chocolate-200 dark:divide-chocolate-800">
          {rows.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-chocolate-50 dark:hover:bg-chocolate-900">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-sm text-neutral-900 dark:text-white border-r border-chocolate-200 dark:border-chocolate-700 last:border-r-0">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ArtifactPreview({ artifact, onClick }: { artifact: Artifact; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-lg border border-chocolate-200 dark:border-chocolate-700 bg-white dark:bg-chocolate-900 hover:bg-chocolate-50 dark:hover:bg-chocolate-800 hover:border-chocolate-300 dark:hover:border-chocolate-600 transition-all text-left"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-chocolate-100 dark:bg-chocolate-800 text-neutral-700 dark:text-neutral-300">
        <KindIcon kind={artifact.kind} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{artifact.title}</p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          {artifact.kind === "code"
            ? getLanguageFromTitle(artifact.title)
            : artifact.kind === "sheet"
            ? "Spreadsheet"
            : "Document"}
        </p>
      </div>
    </button>
  );
}
