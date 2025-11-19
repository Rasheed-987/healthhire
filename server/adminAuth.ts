import type { RequestHandler } from "express";
import { storage } from "./storage";

// Admin role hierarchy
export enum AdminRole {
  MASTER_ADMIN = "master_admin",
  SECONDARY_ADMIN = "secondary_admin",
}

// Check if user is any kind of admin
export const isAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user?.claims?.sub;
    const user = await storage.getUser(userId);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Add admin info to request
    req.admin = {
      userId: user.id,
      role: user.adminRole,
      isMasterAdmin: user.adminRole === AdminRole.MASTER_ADMIN,
      isSecondaryAdmin: user.adminRole === AdminRole.SECONDARY_ADMIN,
    };

    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Check if user is Master Admin (highest level)
export const isMasterAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user?.claims?.sub;
    const user = await storage.getUser(userId);

    if (!user || !user.isAdmin || user.adminRole !== AdminRole.MASTER_ADMIN) {
      return res.status(403).json({ message: "Master Admin access required" });
    }

    // Add admin info to request
    req.admin = {
      userId: user.id,
      role: user.adminRole,
      isMasterAdmin: true,
      isSecondaryAdmin: false,
    };

    next();
  } catch (error) {
    console.error("Master admin authentication error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Check if user is Secondary Admin or higher
export const isSecondaryAdminOrHigher: RequestHandler = async (
  req: any,
  res,
  next
) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user?.claims?.sub;
    const user = await storage.getUser(userId);

    if (
      !user ||
      !user.isAdmin ||
      (user.adminRole !== AdminRole.MASTER_ADMIN &&
        user.adminRole !== AdminRole.SECONDARY_ADMIN)
    ) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Add admin info to request
    req.admin = {
      userId: user.id,
      role: user.adminRole,
      isMasterAdmin: user.adminRole === AdminRole.MASTER_ADMIN,
      isSecondaryAdmin: user.adminRole === AdminRole.SECONDARY_ADMIN,
    };

    next();
  } catch (error) {
    console.error("Secondary admin authentication error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Helper functions for admin operations
export class AdminService {
  // Log admin activity
  static async logActivity(
    adminId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    description?: string,
    metadata?: any
  ) {
    try {
      await storage.createAdminActivityLog({
        adminId,
        action,
        targetType,
        targetId,
        description,
        metadata,
      });
    } catch (error) {
      console.error("Error logging admin activity:", error);
    }
  }

  // Check if admin can perform action on target
  static async canPerformAction(
    adminRole: string,
    action: string,
    targetUserId?: string
  ): Promise<boolean> {
    // Master admin can do everything
    if (adminRole === AdminRole.MASTER_ADMIN) {
      return true;
    }

    // Secondary admin restrictions
    if (adminRole === AdminRole.SECONDARY_ADMIN) {
      // Secondary admin cannot modify master admin accounts
      if (targetUserId) {
        const targetUser = await storage.getUser(targetUserId);
        if (targetUser?.adminRole === AdminRole.MASTER_ADMIN) {
          return false;
        }
      }

      // Secondary admin can do most things except create/delete admins
      const restrictedActions = [
        "create_admin",
        "delete_admin",
        "modify_master_admin",
      ];
      return !restrictedActions.includes(action);
    }

    return false;
  }

  // Get admin dashboard stats
  static async getDashboardStats() {
    try {
      const stats = await storage.getSystemAnalytics();
      return stats;
    } catch (error) {
      console.error("Error fetching admin dashboard stats:", error);
      return null;
    }
  }
}
