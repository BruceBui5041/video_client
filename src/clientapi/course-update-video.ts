export interface UpdateVideoData {
  title?: string;
  slug?: string;
  description?: string;
  order?: number;
  duration?: number;
  allow_preview?: boolean;
  video: File | null;
  thumbnail: File | null;
}

export const updateVideo = async (videoId: number, data: UpdateVideoData) => {
  try {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await fetch(`/api/videos/${videoId}`, {
      method: "PUT",
      body: formData,
      // The following line is not necessary as the browser will automatically set the correct Content-Type for FormData
      // headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating video:", error);
    return { success: false, message: "Failed to update video" };
  }
};
