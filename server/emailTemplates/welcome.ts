// Welcome email template
// This file will be updated when the client provides the final design and content

export interface WelcomeEmailData {
  firstName?: string;
  email: string;
  dashboardUrl: string;
  appUrl: string;
}

export const welcomeEmailTemplate = {
  subject: '🎉 Welcome to HealthHire - Your Healthcare Career Journey Starts Here!',
  
  // AI-generated content (placeholder until client provides final content)
  generateContent: (data: WelcomeEmailData) => ({
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to HealthHire</title>
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
            .features {
              background: #f8f9fa;
              padding: 25px;
              border-radius: 10px;
              margin: 25px 0;
            }
            .features h3 {
              color: #667eea;
              margin-top: 0;
              font-size: 20px;
            }
            .feature-list {
              list-style: none;
              padding: 0;
            }
            .feature-list li {
              padding: 8px 0;
              position: relative;
              padding-left: 30px;
            }
            .feature-list li::before {
              content: '✨';
              position: absolute;
              left: 0;
              top: 8px;
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
            .social-links {
              margin: 15px 0;
            }
            .social-links a {
              display: inline-block;
              margin: 0 10px;
              font-size: 20px;
            }
            .highlight {
              background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to HealthHire!</h1>
              <p>Your Healthcare Career Partner</p>
            </div>
            
            <div class="content">
              <div class="welcome-message">
                <strong>Hello${data.firstName ? ` ${data.firstName}` : ''}!</strong> 🎉
              </div>
              
              <p>Welcome to HealthHire - the premier platform connecting healthcare professionals with their dream careers! We're thrilled to have you join our community of dedicated healthcare workers.</p>
              
              <div class="highlight">
                <strong>🚀 What's Next?</strong><br>
                You're now part of a growing community of healthcare professionals who are advancing their careers with AI-powered tools and personalized job matching.
              </div>
              
              <div class="features">
                <h3>🎯 What You Can Do Now:</h3>
                <ul class="feature-list">
                  <li><strong>AI-Powered Job Matching:</strong> Find roles tailored to your skills and preferences</li>
                  <li><strong>Smart CV Builder:</strong> Create professional resumes with AI assistance</li>
                  <li><strong>Interview Practice:</strong> Prepare with AI-powered mock interviews</li>
                  <li><strong>Career Insights:</strong> Get personalized advice for your healthcare journey</li>
                  <li><strong>Premium Features:</strong> Unlock advanced tools for career advancement</li>
                </ul>
              </div>
              
              <div class="cta-section">
                <h3 style="margin-top: 0; color: white;">Ready to Start Your Journey?</h3>
                <p style="margin-bottom: 20px;">Complete your profile and discover your next career opportunity!</p>
                <a href="${data.dashboardUrl}" class="cta-button">Go to Dashboard</a>
              </div>
              
              <p><strong>💡 Pro Tip:</strong> Complete your profile with your specialties, experience, and preferences to get the most accurate job recommendations.</p>
              
              <p>If you have any questions or need assistance, our support team is here to help. We're committed to supporting your healthcare career journey every step of the way.</p>
              
              <p>Welcome aboard, and best of luck with your healthcare career!</p>
              
              <p>Best regards,<br><strong>The HealthHire Team</strong> 🏥</p>
            </div>
            
            <div class="footer">
              <div class="social-links">
                <a href="#">📧</a>
                <a href="#">💼</a>
                <a href="#">🐦</a>
              </div>
              <p>This email was sent from HealthHire</p>
              <p>© 2024 HealthHire. All rights reserved.</p>
              <p><a href="${data.appUrl}/privacy-policy">Privacy Policy</a> | <a href="${data.appUrl}/terms">Terms of Service</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to HealthHire! 🎉
      
      Hello${data.firstName ? ` ${data.firstName}` : ''}!
      
      Welcome to HealthHire - the premier platform connecting healthcare professionals with their dream careers! We're thrilled to have you join our community of dedicated healthcare workers.
      
      What You Can Do Now:
      ✨ AI-Powered Job Matching: Find roles tailored to your skills and preferences
      ✨ Smart CV Builder: Create professional resumes with AI assistance
      ✨ Interview Practice: Prepare with AI-powered mock interviews
      ✨ Career Insights: Get personalized advice for your healthcare journey
      ✨ Premium Features: Unlock advanced tools for career advancement
      
      Ready to Start Your Journey?
      Complete your profile and discover your next career opportunity!
      Visit: ${data.dashboardUrl}
      
      Pro Tip: Complete your profile with your specialties, experience, and preferences to get the most accurate job recommendations.
      
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
