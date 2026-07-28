/**
 * EmailService.js
 * 
 * This service acts as a wrapper for external email providers (e.g., SendGrid, Resend, Nodemailer).
 * Currently, it logs the emails to the console, acting as a mock integration until real API keys are provided.
 */

export const sendEmail = async ({ to, subject, body }) => {
  // In a real implementation, you would make an API call to your backend
  // which would then securely use SendGrid/Resend to dispatch the email.
  
  console.log(`
  =========================================
  📧 EMAIL DISPATCHED
  =========================================
  To: ${to}
  Subject: ${subject}
  
  Body:
  ${body}
  =========================================
  `);

  // Simulate network delay
  return new Promise(resolve => setTimeout(() => resolve({ success: true }), 500));
};
