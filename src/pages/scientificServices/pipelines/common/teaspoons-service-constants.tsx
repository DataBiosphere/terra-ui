// This file contains constants related to the Teaspoons service.
// Ideally, these would be fetched from the backend, but for now they are hardcoded here
// until we've decided on a good way to expose them via the API.

/* the maximum file input upload size, in bytes */
export const TEASPOONS_MAX_FILE_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024 * 1024; // 50 GiB

/* the default TTL for file outputs in days */
export const TEASPOONS_FILE_OUTPUT_TTL_DAYS = 14;
