"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls, {
  HlsConfig,
  LoaderContext,
  LoaderConfiguration,
  LoaderCallbacks,
  Loader,
  FragmentLoaderContext,
  LoaderStats,
  LoaderResponse,
  ErrorData,
} from "hls.js";

interface HLSPlayerProps {
  clientId: string;
}

const videoSourceAPI = "http://localhost:3000/segment";
const SEGMENT_DURATION = 10; // Assuming each segment is 10 seconds long
const PRELOAD_THRESHOLD = 5; // Preload when within 5 seconds of the end of loaded content

class CustomLoader implements Loader<FragmentLoaderContext> {
  private clientId: string;
  private isLastSegment: boolean = false;
  private videoElement: HTMLVideoElement | null = null;
  public context!: FragmentLoaderContext;
  public stats: LoaderStats;

  constructor(
    config: LoaderConfiguration,
    clientId: string,
    videoElement: HTMLVideoElement
  ) {
    this.clientId = clientId;
    this.videoElement = videoElement;
    this.stats = {
      aborted: false,
      loaded: 0,
      retry: 0,
      total: 0,
      chunkCount: 0,
      bwEstimate: 0,
      loading: { start: 0, first: 0, end: 0 },
      parsing: { start: 0, end: 0 },
      buffering: { start: 0, first: 0, end: 0 },
    };
  }

  destroy(): void {}
  abort(): void {}

  load(
    context: FragmentLoaderContext,
    config: LoaderConfiguration,
    callbacks: LoaderCallbacks<FragmentLoaderContext>
  ): void {
    this.context = context;
    const { url } = context;

    this.stats.loading.start = self.performance.now();

    // For segments, use our custom API with delay
    if (url.endsWith(".ts")) {
      if (this.isLastSegment) {
        callbacks.onSuccess(
          { data: new Uint8Array(0), url: context.url },
          this.stats,
          context,
          null
        );
        return;
      }

      const delayAndFetch = () => {
        fetch(`${videoSourceAPI}?client_id=${this.clientId}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Segment not available");
            }
            return response.arrayBuffer();
          })
          .then((data) => {
            this.stats.loaded = data.byteLength;
            this.stats.loading.end = self.performance.now();
            const response: LoaderResponse = {
              data: new Uint8Array(data),
              url: context.url,
            };

            // Check if this is the last segment (implement your own logic here)
            // if (isLastSegment) {
            //   this.isLastSegment = true;
            // }

            callbacks.onSuccess(response, this.stats, context, null);
          })
          .catch((error) => {
            this.stats.loading.end = self.performance.now();
            callbacks.onError(
              { code: 0, text: error.message },
              context,
              null,
              this.stats
            );
          });
      };

      if (this.videoElement) {
        const currentTime = this.videoElement.currentTime;
        const bufferedEnd =
          this.videoElement.buffered.length > 0
            ? this.videoElement.buffered.end(
                this.videoElement.buffered.length - 1
              )
            : 0;

        if (bufferedEnd - currentTime < PRELOAD_THRESHOLD) {
          delayAndFetch();
        } else {
          const delay = (bufferedEnd - currentTime - PRELOAD_THRESHOLD) * 1000;
          setTimeout(delayAndFetch, delay);
        }
      } else {
        delayAndFetch(); // Fallback if video element is not available
      }
    } else {
      // For other requests (like playlist), use default XHR
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = () => {
        this.stats.loaded = xhr.response.byteLength;
        this.stats.loading.end = self.performance.now();
        const response: LoaderResponse = {
          data: new Uint8Array(xhr.response),
          url: context.url,
        };
        callbacks.onSuccess(response, this.stats, context, xhr);
      };
      xhr.onerror = () => {
        this.stats.loading.end = self.performance.now();
        callbacks.onError(
          { code: xhr.status, text: "XHR error" },
          context,
          xhr,
          this.stats
        );
      };
      xhr.send();
    }
  }

  static createLoader(
    clientId: string,
    videoElement: HTMLVideoElement
  ): new (config: LoaderConfiguration) => Loader<FragmentLoaderContext> {
    return class extends CustomLoader {
      constructor(config: LoaderConfiguration) {
        super(config, clientId, videoElement);
      }
    };
  }
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
