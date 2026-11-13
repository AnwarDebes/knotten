import { photosIn, type LocalPhoto, type PhotoKey } from "@/lib/content/photos";

/**
 * Every photo on the site, with who took it and the licence, in Norwegian: the shape the Klassisk pages have always
 * read. The list itself, in both languages, is src/lib/content/photos.ts; use photoIn(key, "en") there for English.
 */
export type Photo = LocalPhoto;

export const PHOTOS: Record<PhotoKey, Photo> = photosIn("no");
