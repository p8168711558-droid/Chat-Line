import multer from "multer";
import { Request } from "express";

// In-memory upload: we'll stream the file from memory to S3.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
});

// Helper type for downstream controllers
export type UploadRequest = Request & {
  file?: Express.Multer.File;
};

