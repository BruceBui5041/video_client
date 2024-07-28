const BE_API = "http://localhost:3000";

export const SEGMENT_API = `${BE_API}/segment`;
export const UPLOAD_VIDEO_API = `${BE_API}/upload`;
export const REGISTER_API = `${BE_API}/register`;
export const LOGIN_API = `${BE_API}/login`;
export const CHECK_AUTH_API = `${BE_API}/checkauth`;

export const SEGMENT_DURATION = 10; // Assuming each segment is 10 seconds long
export const PRELOAD_THRESHOLD = 5; // Preload when within 5 seconds of the end of loaded content
