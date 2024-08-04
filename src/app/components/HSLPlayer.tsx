"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Hls, { Level, LoaderConfiguration } from "hls.js";
import CustomLoader, { CustomLoaderInterface } from "./CustomHSLLoader";
import { VIDEO_API } from "@/constants";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Rewind,
  FastForward,
  Minimize,
} from "lucide-react";

interface HLSPlayerProps {
  videoSlug: string;
  courseSlug: string;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({ videoSlug, courseSlug }) => {
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
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem(`_volume`);
    return savedVolume ? parseFloat(savedVolume) : 1;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSkipIndicator, setShowSkipIndicator] = useState<
    "backward" | "forward" | null
  >(null);
  const [currentResolution, setCurrentResolution] = useState<string>("Auto");
  const [buffered, setBuffered] = useState<TimeRanges | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

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
        videoSlug,
        courseSlug,
        videoRef.current
      );
      const customLoaderInstance = new customLoader(
        loaderConfig
      ) as CustomLoaderInterface;
      customLoaderRef.current = customLoaderInstance;

      const hls = new Hls({
        debug: true,
        fLoader: customLoader as any,
        maxBufferSize: 5 * 1000 * 1000,
        maxBufferLength: 15,
        startLevel: -1,
        maxMaxBufferLength: 5,
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = true;
        },
      });

      hlsRef.current = hls;

      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        const masterPlaylistUrl = `${VIDEO_API}/playlist/${courseSlug}/${videoSlug}`;
        hls.loadSource(masterPlaylistUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setLevels(hls.levels);
        const availableResolutions = hls.levels.map(
          (level) => `${level.height}p`
        );
        customLoaderInstance.setAvailableResolutions(availableResolutions);

        const savedLevel = getSavedResolution(videoSlug);
        if (savedLevel !== null && savedLevel < hls.levels.length) {
          hls.currentLevel = savedLevel;
        }
        setCurrentLevel(hls.currentLevel);
        updateCurrentResolution(hls.currentLevel);
        setIsPlayerReady(true);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentLevel(data.level);
        updateCurrentResolution(data.level);
        saveResolution(videoSlug, data.level);
      });

      return () => {
        hls.destroy();
      };
    }
  }, [videoSlug, courseSlug]);

  const handleProgressChange = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (videoRef.current && progressRef.current) {
        const rect = progressRef.current.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newTime = pos * videoRef.current.duration;
        videoRef.current.currentTime = newTime;
      }
    },
    []
  );

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const updateBuffered = () => {
      setBuffered(videoElement.buffered);
    };

    videoElement.addEventListener("progress", updateBuffered);

    return () => {
      videoElement.removeEventListener("progress", updateBuffered);
    };
  }, []);

  const renderBufferedRanges = useCallback(() => {
    if (!buffered || !videoRef.current || duration === 0) return null;

    const ranges = [];
    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i);
      const end = buffered.end(i);
      const width = ((end - start) / duration) * 100;
      const left = (start / duration) * 100;
      ranges.push(
        <div
          key={i}
          className="absolute h-full bg-gray-400 opacity-50"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      );
    }
    return ranges;
  }, [buffered, duration]);

  useEffect(() => {
    if (isPlayerReady && videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      localStorage.setItem(`_volume`, volume.toString());
    }
  }, [isPlayerReady, volume, isMuted]);

  const getSavedResolution = useCallback((videoName: string): number | null => {
    const savedResolution = localStorage.getItem(`_resolution`);
    return savedResolution ? parseInt(savedResolution, 10) : null;
  }, []);

  const saveResolution = useCallback((videoName: string, level: number) => {
    localStorage.setItem(`_resolution`, level.toString());
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    videoElement.addEventListener("ended", handleEnded);

    return () => {
      videoElement.removeEventListener("ended", handleEnded);
    };
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

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const updateTime = () => {
      setCurrentTime(videoElement.currentTime);
      setDuration(videoElement.duration);
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };

    videoElement.addEventListener("timeupdate", updateTime);
    videoElement.addEventListener("loadedmetadata", updateTime);
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      videoElement.removeEventListener("timeupdate", updateTime);
      videoElement.removeEventListener("loadedmetadata", updateTime);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [togglePlay]);

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

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    },
    []
  );

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      if (newMutedState) {
        setVolume(0);
      } else {
        const previousVolume = parseFloat(
          localStorage.getItem(`_volume`) || "1"
        );
        setVolume(previousVolume > 0 ? previousVolume : 0.5);
      }
    }
  }, [isMuted]);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    toggleFullscreen();
  }, [toggleFullscreen]);

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
            onDoubleClick={handleDoubleClick}
          />
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div
                ref={progressRef}
                className="relative bg-gray-600 mb-4 cursor-pointer h-1"
                onClick={handleProgressChange}
              >
                {renderBufferedRanges()}
                <div
                  className="absolute top-0 left-0 h-full bg-red-600"
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
                    {isFullscreen ? (
                      <Minimize size={24} />
                    ) : (
                      <Maximize size={24} />
                    )}
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
