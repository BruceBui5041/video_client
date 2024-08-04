import React, {
  useState,
  useCallback,
  ChangeEvent,
  FormEvent,
  useEffect,
} from "react";
import { X } from "lucide-react";
import { updateVideo, UpdateVideoData } from "@/clientapi/course-update-video";
import { generateSlugs } from "@/utils";

interface VideoUpdateFormProps {
  videoId: number;
  initialData: {
    title: string;
    slug: string;
    description: string;
    order: number;
    duration: number;
    allow_preview: boolean;
  };
  onClose: () => void;
  onUpdateSuccess: () => void;
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
  allow_preview: boolean;
}

const UpdateCourseVideoForm: React.FC<VideoUpdateFormProps> = ({
  videoId,
  initialData,
  onClose,
  onUpdateSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: initialData.title,
    slug: initialData.slug,
    description: initialData.description,
    order: initialData.order.toString(),
    duration: initialData.duration.toString(),
    videoFile: null,
    thumbnailFile: null,
    suggestedSlugs: [initialData.slug],
    allow_preview: initialData.allow_preview,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      suggestedSlugs: [prev.slug, ...generateSlugs(prev.title)],
    }));
  }, []);

  const handleInputChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => {
        const updatedData = { ...prev, [name]: value };
        if (name === "title") {
          updatedData.suggestedSlugs = [prev.slug, ...generateSlugs(value)];
        }
        return updatedData;
      });
    },
    []
  );

  const handleCheckboxChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
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
          setFormData((prev) => ({
            ...prev,
            videoFile: file,
            duration: duration.toString(),
          }));
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
      setIsUpdating(true);

      const videoData: UpdateVideoData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        order: parseInt(formData.order),
        duration: parseInt(formData.duration),
        allow_preview: formData.allow_preview,
        video: formData.videoFile,
        thumbnail: formData.thumbnailFile,
      };

      const result = await updateVideo(videoId, videoData);

      if (result.success) {
        setIsUpdating(false);
        setIsUpdated(true);
        onUpdateSuccess();
      } else {
        alert(result.message || "Failed to update video");
        setIsUpdating(false);
      }
    },
    [formData, videoId, onUpdateSuccess]
  );

  return (
    <div className="bg-white border-2 border-gray-300 p-6 rounded-lg mb-6 shadow-md relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
      >
        <X size={24} />
      </button>
      <h3 className="text-lg font-semibold mb-4">Update Video Form</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title:
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div className="w-1/2">
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700"
            >
              Slug:
            </label>
            <select
              id="slug"
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
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description:
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            rows={3}
          ></textarea>
        </div>
        <div className="flex space-x-4">
          <div className="w-1/3">
            <label
              htmlFor="order"
              className="block text-sm font-medium text-gray-700"
            >
              Order:
            </label>
            <input
              type="number"
              id="order"
              name="order"
              value={formData.order}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div className="w-1/3">
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-gray-700"
            >
              Duration (in seconds):
            </label>
            <input
              type="text"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div className="w-1/3 flex items-center">
            <input
              type="checkbox"
              id="allow_preview"
              name="allow_preview"
              checked={formData.allow_preview}
              onChange={handleCheckboxChange}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50"
            />
            <label
              htmlFor="allow_preview"
              className="ml-2 block text-sm font-medium text-gray-700"
            >
              Allow Preview
            </label>
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label
              htmlFor="video"
              className="block text-sm font-medium text-gray-700"
            >
              Video File:
            </label>
            <input
              type="file"
              id="video"
              name="video"
              onChange={(e) => handleFileChange(e, "video")}
              accept="video/*"
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
              htmlFor="thumbnail"
              className="block text-sm font-medium text-gray-700"
            >
              Thumbnail File:
            </label>
            <input
              type="file"
              id="thumbnail"
              name="thumbnail"
              onChange={(e) => handleFileChange(e, "thumbnail")}
              accept="image/*"
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
              isUpdating
                ? "bg-yellow-500"
                : isUpdated
                ? "bg-green-500"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={isUpdating || isUpdated}
          >
            {isUpdating
              ? "Updating..."
              : isUpdated
              ? "Updated"
              : "Update Video"}
          </button>
        </div>
        {isUpdated && (
          <div className="text-green-600 text-center font-bold mt-2">
            Video updated successfully!
          </div>
        )}
      </form>
    </div>
  );
};

export default UpdateCourseVideoForm;
