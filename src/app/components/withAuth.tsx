import { useAuth } from "../../hooks/authHook";
import { useRouter } from "next/navigation";
import { ComponentType, useEffect } from "react";

export function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  return function WithAuth(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push("/login");
      }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return null; // or a loading indicator
    }

    return <WrappedComponent {...props} />;
  };
}
