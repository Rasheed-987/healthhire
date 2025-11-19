import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
import multer from "multer";
import path from "path";
import { Request } from "express";

// Environment variables
const bucketName = process.env.GCS_BUCKET_NAME || "healthhireportal";
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Initialize Google Cloud Storage
let storage: Storage;
if (credentialsJson) {
  // Production: Use JSON credentials from environment variable
  try {
    const credentials = JSON.parse(credentialsJson);
    storage = new Storage({ credentials });
  } catch (error) {
    console.error(
      "Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:",
      error
    );
    throw new Error("Invalid GCS credentials JSON");
  }
} else if (credentialsPath) {
  // Local development: Use credentials file path
  storage = new Storage({ keyFilename: credentialsPath });
} else {
  // Fallback: Use default credentials (for GCP environments)
  storage = new Storage();
}



const bucket = storage.bucket(bucketName);

/**
 * Upload a file to Google Cloud Storage
 * @param file - Multer file object
 * @param folder - Folder path in GCS (e.g., 'documents', 'profile-photos')
 * @param userId - User ID for organizing files
 * @returns Public URL of the uploaded file
 */
export async function uploadFileToGCS(
  file: Express.Multer.File,
  folder: string,
  userId: string
): Promise<string> {
  try {
    // Generate unique filename
    const uniqueId = randomUUID();
    const ext = path.extname(file.originalname);
    const destination = `${folder}/${userId}/${uniqueId}${ext}`;

    // Create blob reference
    const blob = bucket.file(destination);

    // Upload file buffer (NO ACLs - works with UBLA)
    await blob.save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
      metadata: {
        cacheControl: "public, max-age=31536000",
        originalName: file.originalname,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Return public URL
    return getPublicUrl(destination);
  } catch (error) {
    console.error("Error uploading file to GCS:", error);
    throw new Error("File upload failed");
  }
}

/**
 * Delete a file from Google Cloud Storage
 * @param filePath - GCS file path or full URL
 */
export async function deleteFileFromGCS(filePath: string): Promise<void> {
  try {
    // Extract path from URL if full URL is provided
    let gcsPath = filePath;
    if (filePath.startsWith("https://storage.googleapis.com/")) {
      const url = new URL(filePath);
      const pathParts = url.pathname.split("/");
      // Remove empty string and bucket name
      gcsPath = pathParts.slice(2).join("/");
    }

    // Delete the file
    await bucket.file(gcsPath).delete();
    console.log(`Successfully deleted file: ${gcsPath}`);
  } catch (error: any) {
    // Don't throw error if file doesn't exist
    if (error.code === 404) {
      console.warn(`File not found in GCS: ${filePath}`);
      return;
    }
    console.error("Error deleting file from GCS:", error);
    throw new Error("File deletion failed");
  }
}

/**
 * Get public URL for a GCS file
 * @param filePath - Path within the bucket
 * @returns Public URL
 */
export function getPublicUrl(filePath: string): string {
  return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}

/**
 * Check if a file exists in GCS
 * @param filePath - GCS file path
 * @returns Boolean indicating if file exists
 */
export async function fileExistsInGCS(filePath: string): Promise<boolean> {
  try {
    const [exists] = await bucket.file(filePath).exists();
    return exists;
  } catch (error) {
    console.error("Error checking file existence:", error);
    return false;
  }
}

/**
 * Get signed URL for temporary private access
 * Use this for private files or when bucket is not public
 * @param filePath - GCS file path or full URL
 * @param expiresInMinutes - Expiration time in minutes (default: 60)
 * @returns Signed URL
 */
export async function getSignedUrl(
  filePath: string,
  expiresInMinutes: number = 60
): Promise<string> {
  // Extract path from URL if full URL is provided
  let gcsPath = filePath;
  if (filePath.startsWith("https://storage.googleapis.com/")) {
    const url = new URL(filePath);
    const pathParts = url.pathname.split("/");
    // Remove empty string and bucket name
    gcsPath = pathParts.slice(2).join("/");
  }

  try {
    const [url] = await bucket.file(gcsPath).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });
    return url;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error("Failed to generate signed URL");
  }
}

/**
 * Get file URL based on access mode
 * @param filePath - GCS file path
 * @param useSignedUrl - If true, generate signed URL for private access
 * @returns Public URL or signed URL
 */
export async function getFileUrl(
  filePath: string,
  useSignedUrl: boolean = false
): Promise<string> {
  if (useSignedUrl) {
    return await getSignedUrl(filePath);
  }
  return getPublicUrl(filePath);
}

/**
 * DEPRECATED: Old signature - use getSignedUrl instead
 */
export async function getSignedUrlOld(
  filePath: string,
  expiresInMinutes: number = 15
): Promise<string> {
  try {
    const [url] = await bucket.file(filePath).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });
    return url;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error("Failed to generate signed URL");
  }
}

// File filter for validation
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allowed file types
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
  ];

  const allowedExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
  ];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Allowed: PDF, DOCX, PNG, JPG, JPEG, GIF, WEBP"
      )
    );
  }
};

/**
 * Multer configuration for GCS (using memory storage)
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Helper to extract file path from GCS URL
 * @param url - Full GCS URL
 * @returns File path within bucket
 */
export function extractPathFromUrl(url: string): string {
  if (!url.startsWith("https://storage.googleapis.com/")) {
    return url;
  }
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split("/");
  // Remove empty string and bucket name
  return pathParts.slice(2).join("/");
}
