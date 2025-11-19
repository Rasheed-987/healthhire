import { Express } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../email';

export function registerAuthRoutes(app: Express) {
  // Request password reset
  app.post('/api/auth/request-password-reset', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Check if user exists
      const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (user.length === 0) {
        // Don't reveal if email exists or not for security
        return res.json({ 
          message: 'If an account with that email exists, a password reset link has been sent.' 
        });
      }

      const userRecord = user[0];

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Save reset token to database
      await db
        .update(users)
        .set({
          resetToken,
          resetTokenExpires,
        })
        .where(eq(users.id, userRecord.id));

      // Send password reset email
      try {
        await sendPasswordResetEmail(userRecord.email!, resetToken);
        console.log(`Password reset email sent to: ${userRecord.email}`);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email fails, but log it
      }

      res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });

    } catch (error) {
      console.error('Error requesting password reset:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Reset password
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      // Find user with valid reset token
      const user = await db
        .select()
        .from(users)
        .where(eq(users.resetToken, token))
        .limit(1);

      if (user.length === 0) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      const userRecord = user[0];

      // Check if token is expired
      if (!userRecord.resetTokenExpires || userRecord.resetTokenExpires < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update user password and clear reset token
      await db
        .update(users)
        .set({
          passwordHash,
          resetToken: null,
          resetTokenExpires: null,
        })
        .where(eq(users.id, userRecord.id));

      console.log(`Password reset successful for user: ${userRecord.email}`);

      res.json({ message: 'Password has been reset successfully' });

    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Verify reset token (optional endpoint for frontend validation)
  app.post('/api/auth/verify-reset-token', async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: 'Token is required' });
      }

      // Find user with reset token
      const user = await db
        .select()
        .from(users)
        .where(eq(users.resetToken, token))
        .limit(1);

      if (user.length === 0) {
        return res.status(400).json({ message: 'Invalid reset token' });
      }

      const userRecord = user[0];

      // Check if token is expired
      if (!userRecord.resetTokenExpires || userRecord.resetTokenExpires < new Date()) {
        return res.status(400).json({ message: 'Reset token has expired' });
      }

      res.json({ 
        message: 'Token is valid',
        email: userRecord.email 
      });

    } catch (error) {
      console.error('Error verifying reset token:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Verify invitation token
  app.post('/api/auth/verify-invitation', async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: 'Invitation token is required' });
      }

      // Find user with invitation token
      const user = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);

      if (user.length === 0) {
        return res.status(400).json({ message: 'Invalid invitation token' });
      }

      const userRecord = user[0];

      // Check if token is expired
      if (!userRecord.verificationTokenExpires || userRecord.verificationTokenExpires < new Date()) {
        return res.status(400).json({ message: 'Invitation token has expired' });
      }

      // Check if user already has a password (already activated)
      if (userRecord.passwordHash) {
        return res.status(400).json({ message: 'Account has already been activated' });
      }

      res.json({ 
        message: 'Invitation token is valid',
        email: userRecord.email,
        firstName: userRecord.firstName,
        lastName: userRecord.lastName,
        userType: userRecord.userType,
        isValid: true
      });

    } catch (error) {
      console.error('Error verifying invitation token:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Accept invitation and set password
  app.post('/api/auth/accept-invitation', async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: 'Token and password are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      // Find user with invitation token
      const user = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);

      if (user.length === 0) {
        return res.status(400).json({ message: 'Invalid invitation token' });
      }

      const userRecord = user[0];

      // Check if token is expired
      if (!userRecord.verificationTokenExpires || userRecord.verificationTokenExpires < new Date()) {
        return res.status(400).json({ message: 'Invitation token has expired' });
      }

      // Check if user already has a password (already activated)
      if (userRecord.passwordHash) {
        return res.status(400).json({ message: 'Account has already been activated' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Update user with password and clear verification token
      await db
        .update(users)
        .set({
          passwordHash,
          verificationToken: null,
          verificationTokenExpires: null,
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userRecord.id));

      console.log(`Account activated successfully for user: ${userRecord.email}`);

      res.json({ message: 'Account activated successfully' });

    } catch (error) {
      console.error('Error accepting invitation:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}
