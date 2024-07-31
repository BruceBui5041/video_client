import { COURSE_VIDEO_UPLOAD_API } from "@/constants";

interface CreateVideoData {
  title: string;
  slug: string;
  description: string;
  order: string;
  duration: string;
  course_slug: string;
  video: File;
  thumbnail: File;
}

interface Video {
  id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  duration: number;
  courseId: string;
  videoUrl: string;
  thumbnailUrl: string;
}

export const uploadVideo = async (
  videoData: CreateVideoData
): Promise<{
  success: boolean;
  video?: Video;
  message?: string;
}> => {
  try {
    const formData = new FormData();
    Object.entries(videoData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(COURSE_VIDEO_UPLOAD_API, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (response.ok) {
      const { data } = await response.json();
      return { success: true, video: data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to upload video",
      };
    }
  } catch (err) {
    return {
      success: false,
      message: "An error occurred while uploading the video. Please try again.",
    };
  }
};
