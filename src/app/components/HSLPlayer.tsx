"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Hls, { Level, LoaderConfiguration } from "hls.js";
import CustomLoader, { CustomLoaderInterface } from "./CustomHSLLoader";
import { SEGMENT_API } from "@/constants";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Rewind,
  FastForward,
} from "lucide-react";

interface HLSPlayerProps {
  videoName: string;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({ videoName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);
  const [showControls, setShowControls] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSkipIndicator, setShowSkipIndicator] = useState<
    "backward" | "forward" | null
  >(null);
  const [currentResolution, setCurrentResolution] = useState<string>("Auto");

  const customLoaderRef = useRef<CustomLoaderInterface | null>(null);

  useEffect(() => {
    if (Hls.isSupported() && videoRef.current) {
      const loaderConfig: LoaderConfiguration = {
        loadPolicy: {
          maxTimeToFirstByteMs: 8000,
          maxLoadTimeMs: 20000,
          timeoutRetry: null,
          errorRetry: null,
        },
        maxRetry: 3,
        timeout: 30000,
        retryDelay: 1000,
        maxRetryDelay: 8000,
      };

      const customLoader = CustomLoader.createLoader(
        videoName,
        videoRef.current
      );
      const customLoaderInstance = new customLoader(
        loaderConfig
      ) as CustomLoaderInterface;
      customLoaderRef.current = customLoaderInstance;

      const hls = new Hls({
        debug: true,
        fLoader: customLoader as any,
        maxBufferSize: 5 * 1000 * 1000, // 5 MB
        maxBufferLength: 15, // 2 seconds
        startLevel: -1,
        maxMaxBufferLength: 5, // Maximum buffer size in seconds
      });

      hlsRef.current = hls;

      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        const masterPlaylistUrl = `${SEGMENT_API}/playlist/${videoName}`;
        hls.loadSource(masterPlaylistUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setLevels(hls.levels);
        const availableResolutions = hls.levels.map(
          (level) => `${level.height}p`
        );
        customLoaderInstance.setAvailableResolutions(availableResolutions);

        const savedLevel = getSavedResolution(videoName);
        if (savedLevel !== null && savedLevel < hls.levels.length) {
          hls.currentLevel = savedLevel;
        }
        setCurrentLevel(hls.currentLevel);
        updateCurrentResolution(hls.currentLevel);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentLevel(data.level);
        updateCurrentResolution(data.level);
        saveResolution(videoName, data.level);
      });

      return () => {
        hls.destroy();
      };
    }
  }, [videoName]);

  const getSavedResolution = useCallback((videoName: string): number | null => {
    const savedResolution = localStorage.getItem(`${videoName}_resolution`);
    return savedResolution ? parseInt(savedResolution, 10) : null;
  }, []);

  const saveResolution = useCallback((videoName: string, level: number) => {
    localStorage.setItem(`${videoName}_resolution`, level.toString());
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const updateTime = () => {
      setCurrentTime(videoElement.currentTime);
      setDuration(videoElement.duration);
    };

    videoElement.addEventListener("timeupdate", updateTime);
    videoElement.addEventListener("loadedmetadata", updateTime);

    return () => {
      videoElement.removeEventListener("timeupdate", updateTime);
      videoElement.removeEventListener("loadedmetadata", updateTime);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        skipBackward();
      } else if (e.key === "ArrowRight") {
        skipForward();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const updateCurrentResolution = useCallback((level: number) => {
    if (level === -1) {
      setCurrentResolution("Auto");
      if (customLoaderRef.current) {
        customLoaderRef.current.setResolution("Auto");
      }
    } else if (hlsRef.current && hlsRef.current.levels[level]) {
      const resolution = `${hlsRef.current.levels[level].height}p`;
      setCurrentResolution(resolution);
      if (customLoaderRef.current) {
        customLoaderRef.current.setResolution(resolution);
      }
    }
  }, []);

  const handleResolutionChange = useCallback((level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
    }
    setShowQualityMenu(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
      }
      setIsMuted(newVolume === 0);
    },
    []
  );

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (isMuted) {
        setVolume(videoRef.current.volume);
      } else {
        setVolume(0);
      }
    }
  }, [isMuted]);

  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newTime = pos * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      const newTime = Math.max(videoRef.current.currentTime - 5, 0);
      videoRef.current.currentTime = newTime;
      setShowSkipIndicator("backward");
      setTimeout(() => setShowSkipIndicator(null), 500);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (videoRef.current) {
      const newTime = Math.min(
        videoRef.current.currentTime + 5,
        videoRef.current.duration
      );
      videoRef.current.currentTime = newTime;
      setShowSkipIndicator("forward");
      setTimeout(() => setShowSkipIndicator(null), 500);
    }
  }, []);

  const handleMouseEnter = useCallback(() => setShowControls(true), []);
  const handleMouseLeave = useCallback(() => setShowControls(false), []);
  const toggleQualityMenu = useCallback(
    () => setShowQualityMenu(!showQualityMenu),
    [showQualityMenu]
  );

  return (
    <div
      ref={playerRef}
      className="relative w-full max-w-4xl mx-auto bg-black"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {error ? (
        <p className="text-white p-4">{error}</p>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full h-auto"
            onClick={togglePlay}
          />
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div
                ref={progressRef}
                className="h-1 bg-gray-600 mb-4 cursor-pointer"
                onClick={handleProgressChange}
              >
                <div
                  className="h-full bg-red-600"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button onClick={togglePlay} className="text-white">
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  <button onClick={skipBackward} className="text-white">
                    <Rewind size={24} />
                  </button>
                  <button onClick={skipForward} className="text-white">
                    <FastForward size={24} />
                  </button>
                  <button onClick={toggleMute} className="text-white">
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24"
                  />
                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <button
                      className="text-white flex items-center"
                      onClick={toggleQualityMenu}
                    >
                      <Settings size={24} className="mr-2" />
                      <span className="text-sm">{currentResolution}</span>
                    </button>
                    {showQualityMenu && (
                      <div className="absolute bottom-full right-0 bg-black bg-opacity-75 rounded p-2 mb-2">
                        <button
                          className={`block text-white text-sm px-2 py-1 hover:bg-gray-700 w-full text-left ${
                            currentLevel === -1 ? "bg-gray-700" : ""
                          }`}
                          onClick={() => handleResolutionChange(-1)}
                        >
                          Auto
                        </button>
                        {levels.map((level, index) => (
                          <button
                            key={index}
                            className={`block text-white text-sm px-2 py-1 hover:bg-gray-700 w-full text-left ${
                              currentLevel === index ? "bg-gray-700" : ""
                            }`}
                            onClick={() => handleResolutionChange(index)}
                          >
                            {level.height}p
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={toggleFullscreen} className="text-white">
                    <Maximize size={24} />
                  </button>
                </div>
              </div>
            </div>
          )}
          {showSkipIndicator && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-4">
              {showSkipIndicator === "backward" ? (
                <Rewind size={48} className="text-white" />
              ) : (
                <FastForward size={48} className="text-white" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HLSPlayer;
