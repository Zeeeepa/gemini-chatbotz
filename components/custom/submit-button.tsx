"use client";

import { LoaderIcon } from "@/components/custom/icons";

import { Button } from "../ui/button";

export function SubmitButton({
  children,
  isLoading = false,
}: {
  children: React.ReactNode;
  isLoading?: boolean;
}) {
  return (
    <Button
      type="submit"
      aria-disabled={isLoading}
      disabled={isLoading}
      className="relative text-white"
    >
      {children}
      {isLoading && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}
      <span aria-live="polite" className="sr-only" role="status">
        {isLoading ? "Loading" : "Submit form"}
      </span>
    </Button>
  );
}
