"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackButton() {
  const router = useRouter();

  return (
    <Button variant="ghost" size="sm" onClick={() => router.back()}>
      <ArrowLeftIcon />
      Back
    </Button>
  );
}
