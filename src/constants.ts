const BE_API = "http://localhost:3000";

export const VIDEO_API = `${BE_API}/video`;
export const PREVIEW_VIDEO_API = `${BE_API}/preview`;

export const UPLOAD_VIDEO_API = `${BE_API}/upload`;
export const REGISTER_API = `${BE_API}/register`;
export const LOGIN_API = `${BE_API}/login`;
export const CHECK_AUTH_API = `${BE_API}/checkauth`;

export const GET_CATEGORIES_API = `${BE_API}/category`;

export const COURSES_API = `${BE_API}/course`;
export const COURSE_VIDEO_UPLOAD_API = `${BE_API}/video`;

export const SEGMENT_DURATION = 10; // Assuming each segment is 10 seconds long
export const PRELOAD_THRESHOLD = 5; // Preload when within 5 seconds of the end of loaded content
