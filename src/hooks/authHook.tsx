import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/clientapi/checkauth";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // Replace this with your actual authentication check
        const { success, message } = await checkAuth();
        if (!message) {
          throw message;
        }
        setIsAuthenticated(success);
      } catch (error) {
        console.error("Auth check failed", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { isAuthenticated, isLoading };
}
