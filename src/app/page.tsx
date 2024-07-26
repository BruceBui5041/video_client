"use client";

import { useSearchParams } from "next/navigation";
import HLSPlayer from "./components/HSLPlayer";

export default function VideoPage() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "";

  return (
    <div>
      <h1>HLS Video Player</h1>
      <HLSPlayer videoName={name} />
    </div>
  );
}
