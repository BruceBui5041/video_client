import { GET_CATEGORIES_API, COURSES_API } from "@/constants";

interface Category {
  id: number;
  name: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  slug: string;
}

export const getCategories = async (): Promise<{
  success: boolean;
  categories?: Category[];
  message?: string;
}> => {
  try {
    const response = await fetch(GET_CATEGORIES_API, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.ok) {
      const categories: Category[] = await response.json();
      return { success: true, categories };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to fetch categories",
      };
    }
  } catch (err) {
    return {
      success: false,
      message: "An error occurred while fetching categories. Please try again.",
    };
  }
};

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
      const courses: Course[] = await response.json();
      return { success: true, courses };
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