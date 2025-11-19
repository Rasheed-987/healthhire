import nodemailer from "nodemailer";
import {
  invitationEmailTemplate,
  type InvitationEmailData,
} from "./emailTemplates/invitation";
import { env } from "./env.ts";

// Email logging interface
interface EmailLog {
  to: string;
  subject: string;
  type:
    | "welcome"
    | "password_reset"
    | "verification"
    | "general"
    | "invitation";
  status: "sent" | "failed";
  timestamp: Date;
  error?: string;
}

// Simple in-memory email log (in production, you might want to store this in a database)
const emailLogs: EmailLog[] = [];

// Log email send event
function logEmailSend(log: EmailLog): void {
  emailLogs.push(log);
  console.log(
    `📧 Email Log: ${log.type} email ${log.status} to ${
      log.to
    } at ${log.timestamp.toISOString()}`
  );
  if (log.error) {
    console.error(`📧 Email Error: ${log.error}`);
  }
}

// Get email logs (for debugging/admin purposes)
export function getEmailLogs(): EmailLog[] {
  return [...emailLogs];
}

// Clear email logs (for testing)
export function clearEmailLogs(): void {
  emailLogs.length = 0;
}

// Create Nodemailer transporter for Gmail SMTP
const createTransporter = () => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error(
      "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in environment variables."
    );
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(env.SMTP_PORT || "587"),
    secure: env.SMTP_SECURE === "true", // Use TLS for port 587, SSL for port 465
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

// Send password reset email
export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  if (!env.APP_URL) {
    throw new Error("APP_URL not configured in environment variables.");
  }

  const transporter = createTransporter();
  const resetLink = `${env.APP_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: env.EMAIL_FROM || env.SMTP_USER,
    to,
    subject: "Password Reset - HealthHire Portal",
    html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            background: #007bff;
            color: white !important;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .button:hover {
            background: #0056b3;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .link-box {
            word-break: break-all;
            background: #e9ecef;
            padding: 10px;
            border-radius: 5px;
          }
          .link-box a {
            color: #007bff;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Password Reset</h1>
          <p>HealthHire Portal</p>
        </div>
        
        <div class="content">
          <h2>Hello!</h2>
          <p>We received a request to reset your password for your HealthHire Portal account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <div class="link-box">
            <a href="${resetLink}">${resetLink}</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>For security, don't share this link with anyone</li>
            </ul>
          </div>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The HealthHire Portal Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent from HealthHire Portal</p>
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
  `,
    text: `
    Password Reset - HealthHire Portal
    
    Hello!
    
    We received a request to reset your password for your HealthHire Portal account.
    
    Click the link below to reset your password:
    ${resetLink}
    
    This link will expire in 1 hour.
    
    If you didn't request this reset, please ignore this email.
    
    Best regards,
    The HealthHire Portal Team
  `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to: ${to}`);
    logEmailSend({
      to,
      subject: "Password Reset - HealthHire Portal",
      type: "password_reset",
      status: "sent",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    logEmailSend({
      to,
      subject: "Password Reset - HealthHire Portal",
      type: "password_reset",
      status: "failed",
      timestamp: new Date(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Failed to send password reset email");
  }
}

// General email sending function
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> {
  const transporter = createTransporter();

  const mailOptions = {
    from: env.EMAIL_FROM || env.SMTP_USER,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version if not provided
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to: ${to}`);
    logEmailSend({
      to,
      subject,
      type: "general",
      status: "sent",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    logEmailSend({
      to,
      subject,
      type: "general",
      status: "failed",
      timestamp: new Date(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Failed to send email");
  }
}

// Send user invitation email
export async function sendInvitationEmail(
  data: InvitationEmailData
): Promise<void> {
  if (!env.APP_URL) {
    throw new Error("APP_URL not configured in environment variables.");
  }

  const transporter = createTransporter();
  const emailContent = invitationEmailTemplate.generateContent({
    ...data,
    appUrl: env.APP_URL,
  });

  const mailOptions = {
    from: env.EMAIL_FROM || env.SMTP_USER,
    to: data.email,
    subject: invitationEmailTemplate.subject,
    html: emailContent.html,
    text: emailContent.text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invitation email sent successfully to: ${data.email}`);
    logEmailSend({
      to: data.email,
      subject: invitationEmailTemplate.subject,
      type: "invitation",
      status: "sent",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    logEmailSend({
      to: data.email,
      subject: invitationEmailTemplate.subject,
      type: "invitation",
      status: "failed",
      timestamp: new Date(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Failed to send invitation email");
  }
}

// Send greeting email to users (on every login/register)
export async function sendWelcomeEmail(
  to: string,
  firstName?: string,
  isFirstLogin?: boolean
): Promise<void> {
  console.log(`📧 Attempting to send greeting email to: ${to}`);

  const transporter = createTransporter();

  const displayName = firstName ? ` ${firstName}` : "";
  const subject = isFirstLogin
    ? "Welcome to HealthHire!"
    : "Welcome Back to HealthHire!";

  const headerTitle = isFirstLogin
    ? "Welcome to HealthHire!"
    : "Welcome Back to HealthHire!";

  const formattedName = displayName
    ? displayName.charAt(0).toUpperCase() + displayName.slice(1)
    : "";

  const html = `<h2 style="text-transform: capitalize;">Hello ${formattedName},</h2>`;

  const messageBody = isFirstLogin
    ? `
      <p>Welcome to HealthHire! We’re thrilled to have you join our community.</p>
      <p>Here’s how to get started:</p>
      <ul>
        <li>Create or upload your healthcare CV</li>
        <li>Browse top healthcare job openings</li>
        <li>Prepare for interviews with AI assistance</li>
      </ul>
      <p>Let’s start your healthcare career journey today!</p>
    `
    : `
      <p>Welcome back to HealthHire! We’re glad to see you again.</p>
      <p>Here’s what’s new and waiting for you:</p>
      <ul>
        <li>Find your next healthcare job</li>
        <li>Build your professional CV</li>
        <li>Practice for interviews</li>
        <li>Get career insights</li>
      </ul>
    `;

  const mailOptions = {
    from: env.EMAIL_FROM || env.SMTP_USER,
    to,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
           <title>${headerTitle}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #38b9c7;
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #38b9c7;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${headerTitle}</h1>
            <p>Your Healthcare Career Partner</p>
          </div>
          
          <div class="content">
            ${html}

            ${messageBody}

            
            <div style="text-align: center;">
              <a 
              style="text-decoration: none; color: #ffffff;"  
              href="${
                env.APP_URL || "https://healthhire.com"
              }/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <p>Best regards,<br>The HealthHire Team</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome Back to HealthHire! 
      
      Hello${displayName}
      
      Welcome back to HealthHire! We're excited to have you back on our platform.
      
      Here's what you can do:
         Find your next healthcare job
       Build your professional CV
       Practice for interviews
       Get career insights
      
      Visit your dashboard: ${env.APP_URL || "https://healthhire.com"}/dashboard
      
      Best regards,
      The HealthHire Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to: ${to}`);
    logEmailSend({
      to,
      subject: " Welcome Backsss to HealthHire!",
      type: "welcome",
      status: "sent",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    logEmailSend({
      to,
      subject: " Welcome Back to HealthHire!",
      type: "welcome",
      status: "failed",
      timestamp: new Date(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Failed to send welcome email");
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email configuration is valid");
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error);
    return false;
  }
}

export function passwordResetTemplate(resetLink: string) {
  return {
    subject: "Password Reset - HealthHire Portal",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #007bff;
              color: white !important;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover { background: #0056b3; }
            .link-box {
              word-break: break-all;
              background: #e9ecef;
              padding: 10px;
              border-radius: 5px;
            }
            .link-box a {
              color: #007bff;
              text-decoration: underline;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>HealthHire Portal</p>
          </div>
          
          <div class="content">
            <h2>Hello!</h2>
            <p>We received a request to reset your password for your HealthHire Portal account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <div class="link-box">
              <a href="${resetLink}">${resetLink}</a>
            </div>
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in 1 hour.</li>
                <li>If you didn't request this reset, please ignore this email.</li>
                <li>For security, don't share this link with anyone.</li>
              </ul>
            </div>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>The HealthHire Portal Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from HealthHire Portal.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset - HealthHire Portal

      We received a request to reset your password for your HealthHire Portal account.

      Reset link: ${resetLink}

      This link will expire in 1 hour.

      If you didn't request this reset, you can safely ignore this email.

      Best regards,
      The HealthHire Portal Team
    `,
  };
}
