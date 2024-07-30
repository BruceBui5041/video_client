import { COURSES_API } from "@/constants";

export interface Course {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  slug: string;
}

export const getCourses = async (): Promise<{
  success: boolean;
  courses?: Course[];
  message?: string;
}> => {
  try {
    const response = await fetch(COURSES_API, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.ok) {
      const { data } = await response.json();
      return { success: true, courses: data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to fetch courses",
      };
    }
  } catch (err) {
    return {
      success: false,
      message: "An error occurred while fetching courses. Please try again.",
    };
  }
};
