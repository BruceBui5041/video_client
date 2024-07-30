"use client";

import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { generateSlugs } from "../../utils";
import { UPLOAD_VIDEO_API } from "@/constants";

export default function EnhancedVideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [videoId, setVideoId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slugOptions, setSlugOptions] = useState<string[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVideoId(uuidv4());
  }, []);

  useEffect(() => {
    if (title) {
      const newSlugs = generateSlugs(title);
      setSlugOptions(newSlugs);
      setSelectedSlug(newSlugs[0]);
    }
  }, [title]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setTitle(selectedFile.name.split(".").slice(0, -1).join("."));

        // Generate thumbnail
        const url = URL.createObjectURL(selectedFile);
        const video = document.createElement("video");
        video.src = url;
        video.addEventListener("loadeddata", () => {
          video.currentTime = 1; // Set to 1 second
        });
        video.addEventListener("seeked", () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas
            .getContext("2d")
            ?.drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumbnail(canvas.toDataURL());
          URL.revokeObjectURL(url);
        });
      }
    },
    []
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
    },
    []
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDescription(e.target.value);
    },
    []
  );

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedSlug(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!file || !title || !selectedSlug) {
        setError("Please fill in all required fields");
        return;
      }

      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("video", file);
      formData.append("videoId", videoId);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("slug", selectedSlug);

      try {
        const response = await fetch(UPLOAD_VIDEO_API, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const result = await response.text();
        alert(result);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "An error occurred while uploading the video"
        );
      } finally {
        setUploading(false);
      }
    },
    [file, title, selectedSlug, videoId, description]
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
        <form onSubmit={handleSubmit} className="flex flex-row space-x-4">
          <div className="w-2/3 space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Video Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={handleTitleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-900"
                required
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Video Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={handleDescriptionChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-900"
                rows={3}
              />
            </div>
            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700"
              >
                Video Slug
              </label>
              <select
                id="slug"
                value={selectedSlug}
                onChange={handleSlugChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-900"
                required
              >
                {slugOptions.map((slug) => (
                  <option key={slug} value={slug}>
                    {slug}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          <div className="w-1/3 space-y-4">
            <div>
              <label
                htmlFor="video"
                className="block text-sm font-medium text-gray-700"
              >
                Select Video
              </label>
              <input
                type="file"
                id="video"
                accept="video/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-violet-50 file:text-violet-700
                  hover:file:bg-violet-100"
                required
              />
            </div>
            {thumbnail && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Video Thumbnail
                </p>
                <img
                  src={thumbnail}
                  alt="Video thumbnail"
                  className="max-w-full h-auto"
                />
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
