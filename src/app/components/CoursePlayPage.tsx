import React, { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import HLSPlayer from "./HSLPlayer";
import VideoUploadForm from "./UploadCourseVideoForm";
import { getVideos, Video } from "../../clientapi/course-get-video";

export default function CoursePage() {
  const router = useRouter();
  const params = useParams<{ slug: string; videoid: string }>();
  const [videoCards, setVideoCards] = useState<number[]>([]);
  const [nextCardId, setNextCardId] = useState(1);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const courseSlug = params.slug as string;
  const videoId = params.videoid as string;

  const fetchedRef = useRef(false);

  useEffect(() => {
    const fetchVideos = async () => {
      if (fetchedRef.current) return;
      fetchedRef.current = true;

      setIsLoading(true);
      const result = await getVideos(courseSlug);
      if (result.success) {
        const sortedVideos = (result.videos || []).sort(
          (a, b) => a.order - b.order
        );
        setVideos(sortedVideos);

        if (sortedVideos.length > 0) {
          let videoToPlay = videoId
            ? sortedVideos.find((v) => v.id.toString() === videoId) ||
              sortedVideos[0]
            : sortedVideos[0];
          setSelectedVideo(videoToPlay);

          if (videoToPlay.id.toString() !== videoId) {
            router.replace(`/course/${courseSlug}/${videoToPlay.id}`);
          }
        }
        setError(null);
      } else {
        setError(result.message || "Failed to fetch videos");
      }
      setIsLoading(false);
    };

    fetchVideos();
  }, [courseSlug, videoId, router]);

  const addNewVideoCard = useCallback(() => {
    setVideoCards((prev) => [...prev, nextCardId]);
    setNextCardId((prev) => prev + 1);
  }, [nextCardId]);

  const removeVideoCard = useCallback((id: number) => {
    setVideoCards((prev) => prev.filter((cardId) => cardId !== id));
  }, []);

  const handleVideoSelect = useCallback(
    (video: Video) => {
      setSelectedVideo(video);
      router.replace(`/course/${courseSlug}/${video.id}`);
    },
    [courseSlug, router]
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Course: {courseSlug}</h1>

      <div className="flex mb-8">
        {/* Video Player (70% width) */}
        <div className="w-[70%] pr-4">
          <h2 className="text-xl font-bold mb-2">Video Player</h2>
          {selectedVideo ? (
            <HLSPlayer
              videoId={selectedVideo.id.toString()}
              courseSlug={courseSlug}
            />
          ) : (
            <p>Select a video to play</p>
          )}
        </div>

        {/* Video List (30% width) */}
        <div className="w-[30%]">
          <h2 className="text-xl font-bold mb-2">Video List</h2>
          {isLoading ? (
            <p>Loading videos...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <ul className="space-y-2">
              {videos.map((video) => (
                <li
                  key={video.id}
                  className={`p-2 rounded cursor-pointer ${
                    selectedVideo?.id === video.id
                      ? "bg-blue-200"
                      : "bg-gray-100"
                  }`}
                  onClick={() => handleVideoSelect(video)}
                >
                  {video.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Upload New Videos</h2>
          <button
            onClick={addNewVideoCard}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Video
          </button>
        </div>
        {videoCards.map((cardId) => (
          <VideoUploadForm
            key={cardId}
            id={cardId}
            courseSlug={courseSlug}
            onRemove={removeVideoCard}
          />
        ))}
      </div>
    </div>
  );
}
