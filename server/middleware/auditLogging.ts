import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

interface AuditLogData {
  userId: string;
  accessedBy?: string;
  accessType: 'view' | 'edit' | 'delete' | 'export' | 'create';
  dataType: string;
  purpose?: string;
}

// Audit logging middleware that can be applied to routes
export function auditDataAccess(dataType: string, accessType: 'view' | 'edit' | 'delete' | 'export' | 'create', purpose?: string) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.claims?.sub;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      if (userId) {
        await storage.logDataAccess({
          userId,
          accessedBy: userId, // Self-access in most cases
          accessType,
          dataType,
          ipAddress,
          userAgent,
          purpose: purpose || `User ${accessType} ${dataType}`
        });
      }

      next();
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't fail the request if audit logging fails
      next();
    }
  };
}

// Helper function to log admin access to user data
export async function logAdminDataAccess(
  adminUserId: string,
  targetUserId: string,
  accessType: 'view' | 'edit' | 'delete' | 'export',
  dataType: string,
  purpose: string,
  req: Request
) {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    await storage.logDataAccess({
      userId: targetUserId,
      accessedBy: adminUserId,
      accessType,
      dataType,
      ipAddress,
      userAgent,
      purpose
    });
  } catch (error) {
    console.error('Admin audit logging error:', error);
  }
}

// Helper function to log API-based data access
export async function logApiDataAccess(
  userId: string,
  accessType: 'view' | 'edit' | 'delete' | 'export' | 'create',
  dataType: string,
  purpose: string,
  req: Request
) {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    await storage.logDataAccess({
      userId,
      accessedBy: userId,
      accessType,
      dataType,
      ipAddress,
      userAgent,
      purpose
    });
  } catch (error) {
    console.error('API audit logging error:', error);
  }
}

// Comprehensive logging for GDPR data exports
export async function logGdprDataExport(
  userId: string,
  exportType: 'access_request' | 'portability_request' | 'admin_export',
  req: Request
) {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    await storage.logDataAccess({
      userId,
      accessedBy: userId,
      accessType: 'export',
      dataType: 'complete_personal_data',
      ipAddress,
      userAgent,
      purpose: `GDPR ${exportType.replace('_', ' ')} - Complete data export`
    });
  } catch (error) {
    console.error('GDPR export audit logging error:', error);
  }
}

// Logging for data deletion/anonymization
export async function logDataDeletion(
  userId: string,
  deletionType: 'full_deletion' | 'anonymization' | 'partial_deletion',
  adminUserId?: string,
  req?: Request
) {
  try {
    const ipAddress = req?.ip || req?.connection.remoteAddress;
    const userAgent = req?.get('User-Agent');

    await storage.logDataAccess({
      userId,
      accessedBy: adminUserId || userId,
      accessType: 'delete',
      dataType: 'personal_data',
      ipAddress,
      userAgent,
      purpose: `GDPR ${deletionType.replace('_', ' ')}`
    });
  } catch (error) {
    console.error('Data deletion audit logging error:', error);
  }
}