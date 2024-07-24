"use client";

import React from "react";
import {
  LoaderConfiguration,
  LoaderCallbacks,
  Loader,
  FragmentLoaderContext,
  LoaderStats,
  LoaderResponse,
} from "hls.js";

const videoSourceAPI = "http://localhost:3000/segment";
const SEGMENT_DURATION = 10; // Assuming each segment is 10 seconds long
const PRELOAD_THRESHOLD = 15; // Preload when within 5 seconds of the end of loaded content

class CustomLoader implements Loader<FragmentLoaderContext> {
  private videoName: string;
  private isLastSegment: boolean = false;
  private videoElement: HTMLVideoElement | null = null;
  public context!: FragmentLoaderContext;
  public stats: LoaderStats;

  constructor(
    config: LoaderConfiguration,
    videoName: string,
    videoElement: HTMLVideoElement
  ) {
    this.videoName = videoName;
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
        // Extract segment information from the URL
        const segmentInfo = this.extractSegmentInfo(url);

        if (!segmentInfo) {
          callbacks.onError(
            { code: 0, text: "Unable to extract segment information from URL" },
            context,
            null,
            this.stats
          );
          return;
        }

        // Construct the API request URL
        const apiUrl = new URL(videoSourceAPI);

        apiUrl.searchParams.append("name", this.videoName);
        apiUrl.searchParams.append("resolution", "1080p");

        Object.entries(segmentInfo).forEach(([key, value]) => {
          apiUrl.searchParams.append(key, value);
        });

        fetch(apiUrl.toString())
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

  private extractSegmentInfo(url: string): Record<string, string> | null {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split("/");
    const filename = pathSegments[pathSegments.length - 1];

    // Try to extract segment number
    const segmentMatch = filename.match(/segment_(\d+)\.ts/);
    if (segmentMatch) {
      return { segment: segmentMatch[0], number: segmentMatch[1] };
    }

    // Try to extract timestamp
    const timestampMatch = filename.match(/(\d+)\.ts/);
    if (timestampMatch) {
      return { segment: timestampMatch[0], timestamp: timestampMatch[1] };
    }

    // If we can't extract info from the filename, use the whole pathname
    return { path: parsedUrl.pathname };
  }

  static createLoader(
    videoName: string,
    videoElement: HTMLVideoElement
  ): new (config: LoaderConfiguration) => Loader<FragmentLoaderContext> {
    return class extends CustomLoader {
      constructor(config: LoaderConfiguration) {
        super(config, videoName, videoElement);
      }
    };
  }
}

export default CustomLoader;
