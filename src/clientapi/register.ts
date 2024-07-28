import { REGISTER_API } from "@/constants";

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const registerUser = async (
  data: RegisterData
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(REGISTER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Registration failed",
      };
    }
  } catch (err) {
    return { success: false, message: "An error occurred. Please try again." };
  }
};
