"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/app/_components/ui/button";
import { Loader2 } from "lucide-react";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 disabled:opacity-50"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          送信中...
        </>
      ) : (
        "送信する"
      )}
    </Button>
  );
}