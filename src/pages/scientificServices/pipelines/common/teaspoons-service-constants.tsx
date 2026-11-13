// This file contains constants related to the Teaspoons service.
// Ideally, these would be fetched from the backend, but for now they are hardcoded here
// until we've decided on a good way to expose them via the API.

/* the maximum file input upload size, in bytes */
export const TEASPOONS_MAX_FILE_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024 * 1024; // 50 GiB

/* the default TTL for file outputs in days */
export const TEASPOONS_FILE_OUTPUT_TTL_DAYS = 14;

/* how long the browser reuses a batch of output signed URLs before asking for fresh ones.
   Deliberately under the 1hr lifetime of the URLs themselves, so a details page left
   open in a tab doesn't hand out expired URLs. */
export const TEASPOONS_SIGNED_URL_CACHE_TTL_MS = 55 * 60 * 1000; // 55 minutes

/* the share-group for cloud integration features in production */
export const TEASPOONS_SHARE_GROUP_PROD = 'broad-data-science-services@firecloud.org';

/* the share-group for cloud integration features in dev */
export const TEASPOONS_SHARE_GROUP_DEV = 'broad-data-science-services@dev.test.firecloud.org';
