import { Request, Response } from 'express';
import { db } from '../../db';
import { users, type User } from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import { AdminService } from '../../adminAuth';

// Extend Express Request type to include authenticated user
interface AuthenticatedRequest extends Request {
  user: User & {
    claims: {
      sub: string;
    };
  };
}

export async function handleEmployerApproval(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Verify admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid approval status" });
    }

    // Update user approval status
    await db.update(users)
      .set({
        approvalStatus: status,
        approvalDate: new Date(),
      })
      .where(and(
        eq(users.id, userId),
        eq(users.userType, 'employer')
      ));

    const adminId = req.user.id;
    await AdminService.logActivity(
      adminId,
      `employer_${status}`,
      'user',
      userId,
      `Employer ${status === 'approved' ? 'approved' : 'rejected'}`
    );

    res.json({ message: `Employer ${status} successfully` });
  } catch (error) {
    console.error('Error updating employer approval:', error);
    res.status(500).json({ message: "Failed to update employer status" });
  }
}