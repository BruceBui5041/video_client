"use client";

"use client";

import React, { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { useParams } from "next/navigation";
import HLSPlayer from "@/app/components/HSLPlayer";
import { X } from "lucide-react";
import { uploadVideo } from "@/clientapi/course-video-upload";
import { generateSlugs } from "@/utils";

interface FormData {
  title: string;
  slug: string;
  description: string;
  order: string;
}

interface VideoItem {
  id: number;
  title: string;
}

interface VideoUploadCard extends FormData {
  id: number;
  videoFile: File | null;
  thumbnailFile: File | null;
  duration: string;
  isUploading: boolean;
  isUploaded: boolean;
  suggestedSlugs: string[];
}

export default function CoursePage() {
  const params = useParams();
  const [videoCards, setVideoCards] = useState<VideoUploadCard[]>([]);
  const [nextCardId, setNextCardId] = useState(1);

  // Placeholder for video list, replace with actual data fetching logic
  const [videoList] = useState<VideoItem[]>([
    { id: 1, title: "Introduction to the Course" },
    { id: 2, title: "Chapter 1: Basics" },
    { id: 3, title: "Chapter 2: Advanced Topics" },
  ]);

  const handleInputChange = useCallback(
    (
      id: number,
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.target;
      setVideoCards((prev) =>
        prev.map((card) => {
          if (card.id === id) {
            const updatedCard = { ...card, [name]: value };
            if (name === "title") {
              updatedCard.suggestedSlugs = generateSlugs(value);
              updatedCard.slug = updatedCard.suggestedSlugs[0] || "";
            }
            return updatedCard;
          }
          return card;
        })
      );
    },
    []
  );

  const handleFileChange = useCallback(
    (
      id: number,
      e: ChangeEvent<HTMLInputElement>,
      fileType: "video" | "thumbnail"
    ) => {
      const file = e.target.files?.[0] || null;
      if (fileType === "video" && file) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = function () {
          window.URL.revokeObjectURL(video.src);
          const duration = Math.round(video.duration);
          setVideoCards((prev) =>
            prev.map((card) => {
              if (card.id === id) {
                const title = file.name.replace(/\.[^/.]+$/, "");
                const suggestedSlugs = generateSlugs(title);
                return {
                  ...card,
                  videoFile: file,
                  duration: duration.toString(),
                  title,
                  suggestedSlugs,
                  slug: suggestedSlugs[0] || "",
                };
              }
              return card;
            })
          );
        };
        video.src = URL.createObjectURL(file);
      } else {
        setVideoCards((prev) =>
          prev.map((card) =>
            card.id === id
              ? {
                  ...card,
                  [fileType === "video" ? "videoFile" : "thumbnailFile"]: file,
                }
              : card
          )
        );
      }
    },
    []
  );

  const handleSubmit = useCallback(
    async (id: number, e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const card = videoCards.find((c) => c.id === id);
      if (!card) return;

      setVideoCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isUploading: true } : c))
      );

      if (!card.videoFile || !card.thumbnailFile) {
        alert("Please select both video and thumbnail files.");
        setVideoCards((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isUploading: false } : c))
        );
        return;
      }

      const videoData = {
        title: card.title,
        slug: card.slug,
        description: card.description,
        order: card.order,
        duration: card.duration,
        course_slug: params.slug as string,
        video: card.videoFile,
        thumbnail: card.thumbnailFile,
      };

      const result = await uploadVideo(videoData);

      if (result.success) {
        setVideoCards((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, isUploading: false, isUploaded: true } : c
          )
        );
      } else {
        alert(result.message || "Failed to upload video");
        setVideoCards((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isUploading: false } : c))
        );
      }
    },
    [videoCards, params.slug]
  );

  const addNewVideoCard = useCallback(() => {
    setVideoCards((prev) => [
      ...prev,
      {
        id: nextCardId,
        title: "",
        slug: "",
        description: "",
        order: "",
        duration: "",
        videoFile: null,
        thumbnailFile: null,
        isUploading: false,
        isUploaded: false,
        suggestedSlugs: [],
      },
    ]);
    setNextCardId((prev) => prev + 1);
  }, [nextCardId]);

  const removeVideoCard = useCallback((id: number) => {
    setVideoCards((prev) => prev.filter((card) => card.id !== id));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Course: {params.slug}</h1>

      <div className="flex mb-8">
        {/* Video Player (70% width) */}
        <div className="w-[70%] pr-4">
          <h2 className="text-xl font-bold mb-2">Video Player</h2>
          <HLSPlayer videoName={params.slug as string} />
        </div>

        {/* Video List (30% width) */}
        <div className="w-[30%]">
          <h2 className="text-xl font-bold mb-2">Video List</h2>
          <ul className="space-y-2">
            {videoList.map((video) => (
              <li key={video.id} className="p-2 bg-gray-100 rounded">
                {video.title}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Upload Section */}
      <div className="w-[70%]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Upload New Videos</h2>
          <button
            onClick={addNewVideoCard}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Video
          </button>
        </div>
        {videoCards.map((card, index) => (
          <div
            key={card.id}
            className="bg-white border-2 border-gray-300 p-6 rounded-lg mb-6 shadow-md relative"
          >
            <button
              onClick={() => removeVideoCard(card.id)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
            >
              <X size={24} />
            </button>
            <h3 className="text-lg font-semibold mb-4">
              Video Upload Form #{index + 1}
            </h3>
            <form
              onSubmit={(e) => handleSubmit(card.id, e)}
              className="space-y-4"
            >
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label
                    htmlFor={`title-${card.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Title:
                  </label>
                  <input
                    type="text"
                    id={`title-${card.id}`}
                    name="title"
                    value={card.title}
                    onChange={(e) => handleInputChange(card.id, e)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="w-1/2">
                  <label
                    htmlFor={`slug-${card.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Slug:
                  </label>
                  <select
                    id={`slug-${card.id}`}
                    name="slug"
                    value={card.slug}
                    onChange={(e) => handleInputChange(card.id, e)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    {card.suggestedSlugs.map((slug, index) => (
                      <option key={index} value={slug}>
                        {slug}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor={`description-${card.id}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Description:
                </label>
                <textarea
                  id={`description-${card.id}`}
                  name="description"
                  value={card.description}
                  onChange={(e) => handleInputChange(card.id, e)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  rows={3}
                ></textarea>
              </div>
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label
                    htmlFor={`order-${card.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Order:
                  </label>
                  <input
                    type="number"
                    id={`order-${card.id}`}
                    name="order"
                    value={card.order}
                    onChange={(e) => handleInputChange(card.id, e)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="w-1/2">
                  <label
                    htmlFor={`duration-${card.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Duration (in seconds):
                  </label>
                  <input
                    type="text"
                    id={`duration-${card.id}`}
                    name="duration"
                    value={card.duration}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label
                    htmlFor={`video-${card.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Video File:
                  </label>
                  <input
                    type="file"
                    id={`video-${card.id}`}
                    name="video"
                    onChange={(e) => handleFileChange(card.id, e, "video")}
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
                    htmlFor={`thumbnail-${card.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Thumbnail File:
                  </label>
                  <input
                    type="file"
                    id={`thumbnail-${card.id}`}
                    name="thumbnail"
                    onChange={(e) => handleFileChange(card.id, e, "thumbnail")}
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
                    card.isUploading
                      ? "bg-yellow-500"
                      : card.isUploaded
                      ? "bg-green-500"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                  disabled={card.isUploading || card.isUploaded}
                >
                  {card.isUploading
                    ? "Uploading..."
                    : card.isUploaded
                    ? "Uploaded"
                    : "Upload Video"}
                </button>
              </div>
              {card.isUploaded && (
                <div className="text-green-600 text-center font-bold mt-2">
                  Video uploaded successfully!
                </div>
              )}
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
