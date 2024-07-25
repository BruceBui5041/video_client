import {
  LoaderConfiguration,
  LoaderCallbacks,
  Loader,
  FragmentLoaderContext,
  LoaderStats,
  LoaderResponse,
} from "hls.js";

const videoSourceAPI = "http://localhost:3000/segment";

export interface CustomLoaderInterface extends Loader<FragmentLoaderContext> {
  setResolution(resolution: string): void;
  setAvailableResolutions(resolutions: string[]): void;
}

class CustomLoader implements CustomLoaderInterface {
  private videoName: string;
  private isLastSegment: boolean = false;
  private videoElement: HTMLVideoElement | null = null;
  public context!: FragmentLoaderContext;
  public stats: LoaderStats;
  private currentResolution: string = "";
  private availableResolutions: string[] = [];
  private config: LoaderConfiguration;

  constructor(
    config: LoaderConfiguration,
    videoName: string,
    videoElement: HTMLVideoElement
  ) {
    this.videoName = videoName;
    this.videoElement = videoElement;
    this.config = config;
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

      this.fetchSegment(url, callbacks, context);
    } else {
      this.handleNonSegmentRequest(url, callbacks, context);
    }
  }

  private fetchSegment(
    url: string,
    callbacks: LoaderCallbacks<FragmentLoaderContext>,
    context: FragmentLoaderContext
  ): void {
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

    const apiUrl = new URL(videoSourceAPI);
    apiUrl.searchParams.append("name", this.videoName);
    apiUrl.searchParams.append(
      "resolution",
      this.currentResolution || segmentInfo.resolution
    );
    apiUrl.searchParams.append("number", segmentInfo.number);

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
  }

  private handleNonSegmentRequest(
    url: string,
    callbacks: LoaderCallbacks<FragmentLoaderContext>,
    context: FragmentLoaderContext
  ): void {
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

  private extractSegmentInfo(
    url: string
  ): { number: string; resolution: string } | null {
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1];
    const resolution = urlParts[urlParts.length - 2];
    const segmentMatch = filename.match(/segment_(\d+)\.ts/);
    if (segmentMatch && resolution) {
      return { number: segmentMatch[1], resolution };
    }
    return null;
  }

  public setResolution(resolution: string): void {
    this.currentResolution = resolution;
  }

  public setAvailableResolutions(resolutions: string[]): void {
    this.availableResolutions = resolutions;
  }

  static createLoader(
    videoName: string,
    videoElement: HTMLVideoElement
  ): new (config: LoaderConfiguration) => CustomLoaderInterface {
    return class extends CustomLoader {
      constructor(config: LoaderConfiguration) {
        super(config, videoName, videoElement);
      }
    };
  }
}

export default CustomLoader;
