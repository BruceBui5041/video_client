import React, { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { X } from "lucide-react";
import { uploadVideo } from "@/clientapi/course-video-upload";
import { generateSlugs } from "@/utils";

interface VideoUploadFormProps {
  id: number;
  courseSlug: string;
  onRemove: (id: number) => void;
}

interface FormData {
  title: string;
  slug: string;
  description: string;
  order: string;
  duration: string;
  videoFile: File | null;
  thumbnailFile: File | null;
  suggestedSlugs: string[];
}

const VideoUploadForm: React.FC<VideoUploadFormProps> = ({
  id,
  courseSlug,
  onRemove,
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    description: "",
    order: "",
    duration: "",
    videoFile: null,
    thumbnailFile: null,
    suggestedSlugs: [],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

  const handleInputChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => {
        const updatedData = { ...prev, [name]: value };
        if (name === "title") {
          updatedData.suggestedSlugs = generateSlugs(value);
          updatedData.slug = updatedData.suggestedSlugs[0] || "";
        }
        return updatedData;
      });
    },
    []
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>, fileType: "video" | "thumbnail") => {
      const file = e.target.files?.[0] || null;
      if (fileType === "video" && file) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = function () {
          window.URL.revokeObjectURL(video.src);
          const duration = Math.round(video.duration);
          setFormData((prev) => {
            const title = file.name.replace(/\.[^/.]+$/, "");
            const suggestedSlugs = generateSlugs(title);
            return {
              ...prev,
              videoFile: file,
              duration: duration.toString(),
              title,
              suggestedSlugs,
              slug: suggestedSlugs[0] || "",
            };
          });
        };
        video.src = URL.createObjectURL(file);
      } else {
        setFormData((prev) => ({
          ...prev,
          [fileType === "video" ? "videoFile" : "thumbnailFile"]: file,
        }));
      }
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsUploading(true);

      if (!formData.videoFile || !formData.thumbnailFile) {
        alert("Please select both video and thumbnail files.");
        setIsUploading(false);
        return;
      }

      const videoData = {
        ...formData,
        course_slug: courseSlug,
        video: formData.videoFile,
        thumbnail: formData.thumbnailFile,
      };

      const result = await uploadVideo(videoData);

      if (result.success) {
        setIsUploading(false);
        setIsUploaded(true);
      } else {
        alert(result.message || "Failed to upload video");
        setIsUploading(false);
      }
    },
    [formData, courseSlug]
  );

  return (
    <div className="bg-white border-2 border-gray-300 p-6 rounded-lg mb-6 shadow-md relative">
      <button
        onClick={() => onRemove(id)}
        className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
      >
        <X size={24} />
      </button>
      <h3 className="text-lg font-semibold mb-4">Video Upload Form #{id}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label
              htmlFor={`title-${id}`}
              className="block text-sm font-medium text-gray-700"
            >
              Title:
            </label>
            <input
              type="text"
              id={`title-${id}`}
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div className="w-1/2">
            <label
              htmlFor={`slug-${id}`}
              className="block text-sm font-medium text-gray-700"
            >
              Slug:
            </label>
            <select
              id={`slug-${id}`}
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              {formData.suggestedSlugs.map((slug, index) => (
                <option key={index} value={slug}>
                  {slug}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor={`description-${id}`}
            className="block text-sm font-medium text-gray-700"
          >
            Description:
          </label>
          <textarea
            id={`description-${id}`}
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            rows={3}
          ></textarea>
        </div>
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label
              htmlFor={`order-${id}`}
              className="block text-sm font-medium text-gray-700"
            >
              Order:
            </label>
            <input
              type="number"
              id={`order-${id}`}
              name="order"
              value={formData.order}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div className="w-1/2">
            <label
              htmlFor={`duration-${id}`}
              className="block text-sm font-medium text-gray-700"
            >
              Duration (in seconds):
            </label>
            <input
              type="text"
              id={`duration-${id}`}
              name="duration"
              value={formData.duration}
              readOnly
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label
              htmlFor={`video-${id}`}
              className="block text-sm font-medium text-gray-700"
            >
              Video File:
            </label>
            <input
              type="file"
              id={`video-${id}`}
              name="video"
              onChange={(e) => handleFileChange(e, "video")}
              accept="video/*"
              required
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
          <div className="w-1/2">
            <label
              htmlFor={`thumbnail-${id}`}
              className="block text-sm font-medium text-gray-700"
            >
              Thumbnail File:
            </label>
            <input
              type="file"
              id={`thumbnail-${id}`}
              name="thumbnail"
              onChange={(e) => handleFileChange(e, "thumbnail")}
              accept="image/*"
              required
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            className={`px-6 py-2 rounded text-white font-medium ${
              isUploading
                ? "bg-yellow-500"
                : isUploaded
                ? "bg-green-500"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={isUploading || isUploaded}
          >
            {isUploading
              ? "Uploading..."
              : isUploaded
              ? "Uploaded"
              : "Upload Video"}
          </button>
        </div>
        {isUploaded && (
          <div className="text-green-600 text-center font-bold mt-2">
            Video uploaded successfully!
          </div>
        )}
      </form>
    </div>
  );
};

export default VideoUploadForm;
