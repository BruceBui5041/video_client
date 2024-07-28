interface LoginData {
  email: string;
  password: string;
}

export const loginUser = async (
  data: LoginData
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      return { success: false, message: errorData.message || "Login failed" };
    }
  } catch (err) {
    return { success: false, message: "An error occurred. Please try again." };
  }
};
