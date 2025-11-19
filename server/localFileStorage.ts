import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const userId = (req as any).user?.claims?.sub;
    if (!userId) {
      return cb(new Error('User not authenticated'), '');
    }

    // Create user-specific directory
    const userDir = path.join(uploadsDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueId = randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

// File filter for validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];

  const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, DOCX, PNG, JPG'));
  }
};

// Create multer upload middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Helper to get file path
export function getLocalFilePath(userId: string, filename: string): string {
  return path.join(uploadsDir, userId, filename);
}

// Helper to check if file exists
export function fileExists(userId: string, filename: string): boolean {
  const filePath = getLocalFilePath(userId, filename);
  return fs.existsSync(filePath);
}

// Helper to delete file
export function deleteLocalFile(userId: string, filename: string): void {
  const filePath = getLocalFilePath(userId, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// Helper to get file URL for local storage
export function getLocalFileUrl(userId: string, filename: string): string {
  return `/uploads/${userId}/${filename}`;
}
