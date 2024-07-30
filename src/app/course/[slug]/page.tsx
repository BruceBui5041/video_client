"use client";

import HLSPlayer from "@/app/components/HSLPlayer";
import { useParams } from "next/navigation";

export default function CoursePage() {
  const params = useParams();
  const slug = params.slug;

  return (
    <div>
      <h1>Course: {slug}</h1>
      <HLSPlayer videoName={slug} />
    </div>
  );
}
