export interface InvitationEmailData {
  email: string;
  firstName?: string;
  lastName?: string;
  userType: 'applicant' | 'employer';
  invitationToken: string;
  appUrl: string;
}

export const invitationEmailTemplate = {
  subject: 'You\'re Invited to Join HealthHire! 🏥',

  generateContent: (data: InvitationEmailData) => ({
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to HealthHire</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 15px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '🏥';
              font-size: 60px;
              position: absolute;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              opacity: 0.3;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
              margin-top: 20px;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 16px;
              opacity: 0.9;
            }
            .content {
              padding: 40px 30px;
            }
            .welcome-message {
              font-size: 18px;
              margin-bottom: 25px;
              color: #2c3e50;
            }
            .invitation-details {
              background: #f8f9fa;
              padding: 25px;
              border-radius: 10px;
              margin: 25px 0;
              border-left: 4px solid #667eea;
            }
            .cta-section {
              text-align: center;
              margin: 30px 0;
              padding: 25px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              color: white;
            }
            .cta-button {
              display: inline-block;
              background: white;
              color: #667eea;
              padding: 15px 35px;
              text-decoration: none;
              border-radius: 25px;
              font-weight: bold;
              font-size: 16px;
              margin: 15px 0;
              transition: transform 0.2s;
            }
            .cta-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            .footer {
              background: #2c3e50;
              color: white;
              padding: 25px 30px;
              text-align: center;
              font-size: 14px;
            }
            .footer a {
              color: #667eea;
              text-decoration: none;
            }
            .highlight {
              background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            .security-note {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Invited to HealthHire!</h1>
              <p>Your Healthcare Career Partner</p>
            </div>
            
            <div class="content">
              <div class="welcome-message">
                <strong>Hello${data.firstName ? ` ${data.firstName}` : ''}! 👋</strong>
              </div>
              
              <p>You've been invited to join HealthHire - the premier platform connecting healthcare professionals with their dream careers! We're excited to have you join our community of dedicated healthcare workers.</p>
              
              <div class="invitation-details">
                <strong>📧 Invitation Details:</strong><br>
                <strong>Email:</strong> ${data.email}<br>
                <strong>Account Type:</strong> ${data.userType === 'applicant' ? 'Healthcare Professional' : 'Employer'}<br>
                <strong>Invited by:</strong> HealthHire Admin Team
              </div>
              
              <div class="highlight">
                <strong>🚀 What You Can Do:</strong><br>
                ${data.userType === 'applicant' 
                  ? '• Find your next healthcare job with AI-powered matching<br>• Build professional CVs with AI assistance<br>• Practice for interviews with personalized feedback<br>• Track your applications and career progress'
                  : '• Post healthcare job opportunities<br>• Find qualified healthcare professionals<br>• Manage your recruitment process<br>• Access premium employer tools'
                }
              </div>
              
              <div class="cta-section">
                <h3 style="margin-top: 0; color: white;">Ready to Get Started?</h3>
                <p style="margin-bottom: 20px;">Click the button below to set your password and activate your account!</p>
                <a href="${data.appUrl}/accept-invite?token=${data.invitationToken}" class="cta-button">
                  Set Password & Join HealthHire
                </a>
              </div>
              
              <div class="security-note">
                <strong>🔒 Security Note:</strong> This invitation link is secure and will expire in 7 days. If you didn't expect this invitation, please ignore this email or contact our support team.
              </div>
              
              <p>If you have any questions or need assistance, our support team is here to help. We're committed to supporting your healthcare career journey every step of the way.</p>
              
              <p>Welcome aboard, and best of luck with your healthcare career!</p>
              
              <p><strong>Best regards,<br>The HealthHire Team 🏥</strong></p>
            </div>
            
            <div class="footer">
              <p>This email was sent from HealthHire</p>
              <p>© 2024 HealthHire. All rights reserved.</p>
              <p><a href="${data.appUrl}/privacy">Privacy Policy</a> | <a href="${data.appUrl}/terms">Terms of Service</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      You're Invited to HealthHire! 🎉
      
      Hello${data.firstName ? ` ${data.firstName}` : ''}!
      
      You've been invited to join HealthHire - the premier platform connecting healthcare professionals with their dream careers! We're excited to have you join our community of dedicated healthcare workers.
      
      Invitation Details:
      Email: ${data.email}
      Account Type: ${data.userType === 'applicant' ? 'Healthcare Professional' : 'Employer'}
      Invited by: HealthHire Admin Team
      
      What You Can Do:
      ${data.userType === 'applicant' 
        ? '• Find your next healthcare job with AI-powered matching\n• Build professional CVs with AI assistance\n• Practice for interviews with personalized feedback\n• Track your applications and career progress'
        : '• Post healthcare job opportunities\n• Find qualified healthcare professionals\n• Manage your recruitment process\n• Access premium employer tools'
      }
      
      Ready to Get Started?
      Click the link below to set your password and activate your account:
      ${data.appUrl}/accept-invite?token=${data.invitationToken}
      
      Security Note: This invitation link is secure and will expire in 7 days. If you didn't expect this invitation, please ignore this email or contact our support team.
      
      If you have any questions or need assistance, our support team is here to help. We're committed to supporting your healthcare career journey every step of the way.
      
      Welcome aboard, and best of luck with your healthcare career!
      
      Best regards,
      The HealthHire Team 🏥
      
      ---
      This email was sent from HealthHire
      © 2024 HealthHire. All rights reserved.
    `
  })
};
