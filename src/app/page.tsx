"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HLSPlayer from "./components/HSLPlayer";
import { checkAuth } from "../clientapi/checkauth";

export default function VideoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const name = searchParams.get("name") || "";

  useEffect(() => {
    const authenticate = async () => {
      const authResult = await checkAuth();

      if (authResult.success) {
        router.push("/course");
      } else {
        setAuthError(authResult.message || "Authentication failed");
        setIsLoading(false);
      }
    };

    authenticate();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (authError) {
    return <div>Error: {authError}</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
}
