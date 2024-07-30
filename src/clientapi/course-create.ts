import { COURSES_API } from "@/constants";

interface CreateCourseData {
  title: string;
  description: string;
  category_id: number;
  slug: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  slug: string;
}

export const createCourse = async (
  courseData: CreateCourseData
): Promise<{
  success: boolean;
  course?: Course;
  message?: string;
}> => {
  try {
    const response = await fetch(COURSES_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(courseData),
      credentials: "include",
    });

    if (response.ok) {
      const course: Course = await response.json();
      return { success: true, course };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to create course",
      };
    }
  } catch (err) {
    return {
      success: false,
      message: "An error occurred while creating the course. Please try again.",
    };
  }
};
