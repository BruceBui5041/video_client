"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls, { ErrorData } from "hls.js";
import CustomLoader from "./CustomHSLLoader";
import { videoSourceAPI } from "@/constants";

interface HLSPlayerProps {
  clientId: string;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({ clientId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Hls.isSupported() && videoRef.current) {
      const hls = new Hls({
        debug: true,
        fLoader: CustomLoader.createLoader(clientId, videoRef.current) as any,
        maxBufferSize: 30 * 1000 * 1000, // 30 MB
        maxBufferLength: 5, // 5 seconds
      });
      hlsRef.current = hls;

      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(`${videoSourceAPI}/playlist.m3u8?client_id=${clientId}`);
      });

      hls.on(Hls.Events.ERROR, (event: string, data: ErrorData) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError("An error occurred while loading the video.");
              break;
          }
        }
      });

      return () => {
        if (hls) {
          hls.destroy();
        }
      };
    } else if (
      videoRef.current &&
      videoRef.current.canPlayType("application/vnd.apple.mpegurl")
    ) {
      videoRef.current.src = `${videoSourceAPI}/playlist.m3u8?client_id=${clientId}`;
    } else {
      setError("HLS is not supported in this browser.");
    }
  }, [clientId]);

  return (
    <div>
      {error ? (
        <p>{error}</p>
      ) : (
        <video
          ref={videoRef}
          controls
          style={{ width: "100%", maxWidth: "640px" }}
        />
      )}
    </div>
  );
};

export default HLSPlayer;
