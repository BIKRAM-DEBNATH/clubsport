const nodemailer = require('nodemailer');

const APP_NAME = 'ClubSport Registration';
const MAX_RETRIES = 2;

let _transporter = null;

function createTransporter() {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.error('❌ Email: SMTP_USER or SMTP_PASS not configured. Email will not work.');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    requireTLS: true,
    auth: { user: smtpUser, pass: smtpPass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
    tls: { rejectUnauthorized: false },
  });
}

function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = createTransporter();
  return _transporter;
}

function resetTransporter() {
  if (_transporter) {
    try { _transporter.close(); } catch {}
  }
  _transporter = null;
}

async function verifyConnection() {
  const transporter = getTransporter();
  if (!transporter) {
    console.error('❌ Email: Transporter could not be created. Check SMTP_USER and SMTP_PASS env vars.');
    return false;
  }
  try {
    await transporter.verify();
    console.log('✅ Email: SMTP connection verified — ready to send emails');
    return true;
  } catch (err) {
    console.error('❌ Email: SMTP verification failed —', err.message);
    if (err.code === 'EAUTH') {
      console.error('   → Authentication failed. For Gmail: ensure 2FA is enabled and use an App Password.');
    } else if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT') {
      console.error('   → Could not reach SMTP server. Check SMTP_HOST, SMTP_PORT, and firewall.');
    }
    resetTransporter();
    return false;
  }
}

async function sendEmail(to, subject, html) {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

  if (!fromEmail) {
    console.error('❌ Email: FROM_EMAIL / SMTP_USER not configured — skipping send');
    return { success: false, error: 'Email not configured' };
  }

  if (!to) {
    console.error('❌ Email: No recipient address provided — skipping send');
    return { success: false, error: 'No recipient' };
  }

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      let transporter = getTransporter();
      if (!transporter) {
        resetTransporter();
        transporter = createTransporter();
        if (!transporter) return { success: false, error: 'SMTP not configured' };
      }

      const info = await transporter.sendMail({
        from: `"${APP_NAME}" <${fromEmail}>`,
        to,
        subject,
        html,
      });

      console.log(`📧 Email sent to ${to} [${subject}] — messageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };

    } catch (err) {
      lastError = err;
      console.error(`❌ Email attempt ${attempt}/${MAX_RETRIES + 1} failed for ${to}:`, err.code || err.message);

      if (err.code === 'EAUTH') {
        console.error('   → Auth error — will not retry. Check SMTP_USER / SMTP_PASS.');
        break;
      }

      resetTransporter();

      if (attempt <= MAX_RETRIES) {
        const delay = 1000 * attempt;
        console.log(`   → Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  console.error(`❌ Email permanently failed for ${to}: ${lastError?.code || lastError?.message}`);
  return { success: false, error: lastError?.message };
}

function wrapHtml(title, bodyHtml) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
.header{background:linear-gradient(135deg,#0088ff,#00c8ff);padding:30px;text-align:center}
.header h1{color:#fff;margin:0;font-size:22px;letter-spacing:1px}
.content{padding:30px;color:#333;line-height:1.6}
.footer{background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#888}
.status-badge{display:inline-block;padding:6px 14px;border-radius:20px;font-weight:600;font-size:13px}
.status-approved{background:#d4edda;color:#155724}
.status-rejected{background:#f8d7da;color:#721c24}
.status-pending{background:#fff3cd;color:#856404}
</style></head>
<body>
<div class="container">
<div class="header"><h1>🏟️ ${APP_NAME}</h1></div>
<div class="content"><h2>${title}</h2>${bodyHtml}</div>
<div class="footer"><p>Automated message from ${APP_NAME}.</p><p>© ${new Date().getFullYear()} ClubSport.</p></div>
</div></body></html>`;
}

function registrationSuccessEmail(athlete) {
  const html = wrapHtml('Registration Successful! 🎉', `
    <p>Hi <strong>${athlete.firstName} ${athlete.lastName}</strong>,</p>
    <p>Your registration has been submitted successfully!</p>
    <div style="background:#f0f8ff;padding:16px;border-radius:8px;margin:16px 0">
      <p><strong>Reg No:</strong> ${athlete.registrationNumber}</p>
      <p><strong>Name:</strong> ${athlete.firstName} ${athlete.lastName}</p>
      <p><strong>Email:</strong> ${athlete.email}</p>
      <p><strong>Mobile:</strong> ${athlete.mobile}</p>
      <p><strong>Status:</strong> <span class="status-badge status-pending">⏳ Pending Review</span></p>
    </div>
    <p>You will receive another email once your application is reviewed.</p>`);
  return sendEmail(athlete.email, `Registration Successful — ${athlete.registrationNumber}`, html);
}

function registrationFailedEmail(data, reason) {
  const html = wrapHtml('Registration Failed ❌', `
    <p>Hi <strong>${data.firstName || 'Athlete'}</strong>,</p>
    <p>Your registration could not be completed.</p>
    <div style="background:#fff3cd;padding:16px;border-radius:8px;margin:16px 0"><p><strong>Reason:</strong> ${reason}</p></div>
    <p>Please review and try again.</p>`);
  return sendEmail(data.email, 'Registration Failed — Action Required', html);
}

function uploadSuccessEmail(athlete, uploadedDocs) {
  const docList = uploadedDocs.map(d => `<li>✅ ${d}</li>`).join('');
  const html = wrapHtml('Documents Uploaded Successfully 📁', `
    <p>Hi <strong>${athlete.firstName} ${athlete.lastName}</strong>,</p>
    <p>Your documents have been uploaded successfully!</p>
    <ul>${docList}</ul>
    <p>Your registration is now complete and awaiting admin review.</p>`);
  return sendEmail(athlete.email, 'Documents Uploaded Successfully', html);
}

function uploadFailedEmail(athlete, reason) {
  const html = wrapHtml('Document Upload Failed ⚠️', `
    <p>Hi <strong>${athlete.firstName} ${athlete.lastName}</strong>,</p>
    <p>We encountered an issue uploading your documents.</p>
    <div style="background:#f8d7da;padding:16px;border-radius:8px;margin:16px 0"><p><strong>Reason:</strong> ${reason}</p></div>
    <p>Please try uploading again.</p>`);
  return sendEmail(athlete.email, 'Document Upload Failed — Please Retry', html);
}

function statusUpdateEmail(athlete, oldStatus, newStatus, remarks) {
  const statusClass = newStatus === 'Approved' ? 'status-approved' : newStatus === 'Rejected' ? 'status-rejected' : 'status-pending';
  const statusIcon = newStatus === 'Approved' ? '✅' : newStatus === 'Rejected' ? '❌' : '⏳';
  const html = wrapHtml(`Application Status Updated — ${newStatus}`, `
    <p>Hi <strong>${athlete.firstName} ${athlete.lastName}</strong>,</p>
    <p>Your application status has been updated.</p>
    <div style="background:#f0f8ff;padding:16px;border-radius:8px;margin:16px 0">
      <p><strong>Reg No:</strong> ${athlete.registrationNumber}</p>
      <p><strong>Previous:</strong> ${oldStatus}</p>
      <p><strong>New Status:</strong> <span class="status-badge ${statusClass}">${statusIcon} ${newStatus}</span></p>
      ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
    </div>
    ${newStatus === 'Approved' ? '<p>🎉 Congratulations! Your registration has been approved.</p>' : ''}
    ${newStatus === 'Rejected' ? '<p>Your application was not approved. Please contact support if you have questions.</p>' : ''}`);
  return sendEmail(athlete.email, `Application ${newStatus} — ${athlete.registrationNumber}`, html);
}

function bulkDeleteEmail(athlete) {
  const html = wrapHtml('Account Deleted 🗑️', `
    <p>Hi <strong>${athlete.firstName} ${athlete.lastName}</strong>,</p>
    <p>Your registration has been removed from our system.</p>
    <div style="background:#f8f9fa;padding:16px;border-radius:8px;margin:16px 0">
      <p><strong>Reg No:</strong> ${athlete.registrationNumber}</p>
      <p><strong>Deleted On:</strong> ${new Date().toLocaleString('en-IN')}</p>
    </div>
    <p>If you believe this was done in error, please contact support.</p>`);
  return sendEmail(athlete.email, 'Account Deleted — ' + athlete.registrationNumber, html);
}

module.exports = {
  verifyConnection,
  sendEmail,
  registrationSuccessEmail,
  registrationFailedEmail,
  uploadSuccessEmail,
  uploadFailedEmail,
  statusUpdateEmail,
  bulkDeleteEmail,
};
