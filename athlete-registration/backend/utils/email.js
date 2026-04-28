const nodemailer = require('nodemailer');

// ✅ Create reusable SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@clubsport.com';
const APP_NAME = 'ClubSport Registration';

// ✅ HTML email wrapper
function wrapHtml(title, bodyHtml) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0088ff, #00c8ff); padding: 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; letter-spacing: 1px; }
    .content { padding: 30px; color: #333; line-height: 1.6; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888; }
    .btn { display: inline-block; padding: 12px 24px; background: #0088ff; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .status-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; }
    .status-approved { background: #d4edda; color: #155724; }
    .status-rejected { background: #f8d7da; color: #721c24; }
    .status-pending { background: #fff3cd; color: #856404; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏟️ ${APP_NAME}</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>This is an automated message from ${APP_NAME}.</p>
      <p>© ${new Date().getFullYear()} ClubSport. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// ✅ Send email helper
async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ─── TEMPLATES ───────────────────────────────────────────────

function registrationSuccessEmail(athlete) {
  const html = wrapHtml('Registration Successful! 🎉', `
    <p>Hi <strong>${athlete.firstName} ${athlete.lastName}</strong>,</p>
    <p>Your registration has been submitted successfully!</p>
    <div style="background:#f0f8ff; padding:16px; border-radius:8px; margin:16px 0;">
      <p style="margin:4px 0"><strong>Registration Number:</strong> <code style="background:#e0e0e0; padding:2px 8px; border-radius:4px;">${athlete.registrationNumber}</code></p>
      <p style="margin:4px 0"><strong>Name:</strong> ${athlete.firstName} ${athlete.lastName}</p>
      <p style="margin:4px 0"><strong>Email:</strong> ${athlete.email}</p>
      <p style="margin:4px 0"><strong>Mobile:</strong> ${athlete.mobile}</p>
    </div>
    <p>Your application is currently <span class="status-badge status-pending">⏳ Pending Review</span></p>
    <p>You will receive another email once your application is reviewed by our admin team.</p>
  `);
  return sendEmail(athlete.email, `Registration Successful — ${athlete.registrationNumber}`, html);
}

function registrationFailedEmail(data, reason) {
  const html = wrapHtml('Registration Failed ❌', `
    <p>Hi <strong>${data.firstName || 'Athlete'}</strong>,</p>
    <p>We regret to inform you that your registration could not be completed.</p>
    <div style="background:#fff3cd; padding:16px; border-radius:8px; margin:16px 0;">
      <p style="margin:4px 0"><strong>Reason:</strong> ${reason}</p>
    </div>
    <p>Please review the information provided and try again. If you need assistance, contact our support team.</p>
  `);
  return sendEmail(data.email, 'Registration Failed — Action Required', html);
}

function uploadSuccessEmail(athlete, uploadedDocs) {
  const docList = uploadedDocs.map(d => `<li>✅ ${d}</li>`).join('');
  const html = wrapHtml('Documents Uploaded Successfully 📁', `
    <p>Hi <strong>${athlete.firstName} ${athlete.lastName}</strong>,</p>
    <p>Your documents have been uploaded successfully!</p>
    <p><strong>Uploaded Documents:</strong></p>
    <ul>${docList}</ul>
    <p>Your registration is now complete and awaiting admin review.</p>
  `);
  return sendEmail(athlete.email, 'Documents Uploaded Successfully', html);
}

function uploadFailedEmail(athlete, reason) {
  const html = wrapHtml('Document Upload Failed ⚠️', `
    <p>Hi <strong>${athlete.firstName} ${athlete.lastName}</strong>,</p>
    <p>We encountered an issue while uploading your documents.</p>
    <div style="background:#f8d7da; padding:16px; border-radius:8px; margin:16px 0;">
      <p style="margin:4px 0"><strong>Reason:</strong> ${reason}</p>
    </div>
    <p>Please try uploading your documents again. If the issue persists, contact support.</p>
  `);
  return sendEmail(athlete.email, 'Document Upload Failed — Please Retry', html);
}

function statusUpdateEmail(athlete, oldStatus, newStatus, remarks) {
  const statusClass = newStatus === 'Approved' ? 'status-approved' : newStatus === 'Rejected' ? 'status-rejected' : 'status-pending';
  const statusIcon = newStatus === 'Approved' ? '✅' : newStatus === 'Rejected' ? '❌' : '⏳';
  const html = wrapHtml(`Application Status Updated — ${newStatus}`, `
    <p>Hi <strong>${athlete.firstName} ${athlete.lastName}</strong>,</p>
    <p>Your application status has been updated by our admin team.</p>
    <div style="background:#f0f8ff; padding:16px; border-radius:8px; margin:16px 0;">
      <p style="margin:4px 0"><strong>Registration Number:</strong> ${athlete.registrationNumber}</p>
      <p style="margin:4px 0"><strong>Previous Status:</strong> ${oldStatus}</p>
      <p style="margin:4px 0"><strong>New Status:</strong> <span class="status-badge ${statusClass}">${statusIcon} ${newStatus}</span></p>
      ${remarks ? `<p style="margin:4px 0"><strong>Admin Remarks:</strong> ${remarks}</p>` : ''}
    </div>
    ${newStatus === 'Approved' ? '<p>🎉 Congratulations! Your registration has been approved. You can now participate in the events.</p>' : ''}
    ${newStatus === 'Rejected' ? '<p>Your application was not approved at this time. Please review the remarks above and contact support if you have questions.</p>' : ''}
  `);
  return sendEmail(athlete.email, `Application ${newStatus} — ${athlete.registrationNumber}`, html);
}

function bulkDeleteEmail(athlete) {
  const html = wrapHtml('Account Deleted 🗑️', `
    <p>Hi <strong>${athlete.firstName} ${athlete.lastName}</strong>,</p>
    <p>Your registration has been removed from our system by an administrator.</p>
    <div style="background:#f8f9fa; padding:16px; border-radius:8px; margin:16px 0;">
      <p style="margin:4px 0"><strong>Registration Number:</strong> ${athlete.registrationNumber}</p>
      <p style="margin:4px 0"><strong>Deleted On:</strong> ${new Date().toLocaleString('en-IN')}</p>
    </div>
    <p>If you believe this was done in error, please contact our support team immediately.</p>
  `);
  return sendEmail(athlete.email, 'Account Deleted — ' + athlete.registrationNumber, html);
}

module.exports = {
  sendEmail,
  registrationSuccessEmail,
  registrationFailedEmail,
  uploadSuccessEmail,
  uploadFailedEmail,
  statusUpdateEmail,
  bulkDeleteEmail,
};

