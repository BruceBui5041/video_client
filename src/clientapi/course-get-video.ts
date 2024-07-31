import { COURSE_VIDEO_UPLOAD_API } from "../constants";

export interface Video {
  id: number;
  title: string;
  description: string;
  slug: string;
  duration: number;
  order: number;
  thumbnail_url: string;
}

export const getVideos = async (
  courseSlug: string
): Promise<{
  success: boolean;
  videos?: Video[];
  message?: string;
}> => {
  try {
    const response = await fetch(`${COURSE_VIDEO_UPLOAD_API}/${courseSlug}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.ok) {
      const { data } = await response.json();
      return { success: true, videos: data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to fetch videos",
      };
    }
  } catch (err) {
    return {
      success: false,
      message: "An error occurred while fetching videos. Please try again.",
    };
  }
};
