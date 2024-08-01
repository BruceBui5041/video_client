import { CHECK_AUTH_API } from "@/constants";

interface LoginData {
  email: string;
  password: string;
}

export const checkAuth = async (): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const response = await fetch(CHECK_AUTH_API, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();

      return { success: false, message: errorData.message || "Login failed" };
    }
  } catch (err) {
    console.log("abcd", err);

    return { success: false, message: "An error occurred. Please try again." };
  }
};
