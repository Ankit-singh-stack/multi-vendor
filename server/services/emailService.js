const nodemailer = require('nodemailer');

const isMailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

let transporter = null;
if (isMailConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log(`[email:dev] To: ${to} | Subject: ${subject}`);
    return { preview: true };
  }
  return transporter.sendMail({
    from: process.env.MAIL_FROM || 'MarketSphere <no-reply@marketsphere.test>',
    to,
    subject,
    html,
    text,
  });
};

const emailShell = (title, body) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#4338ca;color:#fff;padding:24px 28px">
      <h1 style="margin:0;font-size:22px">MarketSphere</h1>
      <p style="margin:6px 0 0;opacity:.85;font-size:13px">Your multi-vendor marketplace</p>
    </div>
    <div style="padding:28px">
      <h2 style="margin-top:0;color:#111827">${title}</h2>
      ${body}
    </div>
    <div style="padding:18px 28px;background:#f9fafb;color:#6b7280;font-size:12px">
      This is an automated message from MarketSphere.
    </div>
  </div>`;

const sendOrderConfirmation = (user, order) =>
  sendEmail({
    to: user.email,
    subject: `Order ${order.orderNumber} confirmed`,
    html: emailShell(
      'Thanks for your order!',
      `<p>Hi ${user.name},</p>
       <p>Your order <strong>${order.orderNumber}</strong> has been successfully placed.</p>
       <p>Total paid: <strong>₹${order.pricing.grandTotal.toFixed(2)}</strong></p>
       <p>You can track your order from your MarketSphere account.</p>`
    ),
  }).catch((err) => console.error('Order email failed:', err.message));

const sendSellerApproval = (user, approved) =>
  sendEmail({
    to: user.email,
    subject: approved ? 'Your MarketSphere seller account is approved' : 'Seller application update',
    html: emailShell(
      approved ? 'You are ready to sell!' : 'Application not approved',
      approved
        ? `<p>Hi ${user.name},</p><p>Your seller account has been approved. Log in to your seller dashboard and start adding products.</p>`
        : `<p>Hi ${user.name},</p><p>Unfortunately your seller application was not approved. Please contact support for details.</p>`
    ),
  }).catch((err) => console.error('Seller email failed:', err.message));

const sendPasswordReset = (user, resetUrl) =>
  sendEmail({
    to: user.email,
    subject: 'Reset your MarketSphere password',
    html: emailShell(
      'Password reset request',
      `<p>Hi ${user.name},</p>
       <p>Click the link below to reset your password. The link is valid for 30 minutes.</p>
       <p><a href="${resetUrl}" style="background:#4338ca;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Reset password</a></p>
       <p style="color:#6b7280;font-size:12px">If you did not request this, you can safely ignore this email.</p>`
    ),
  }).catch((err) => console.error('Reset email failed:', err.message));

module.exports = { sendEmail, sendOrderConfirmation, sendSellerApproval, sendPasswordReset, isMailConfigured };
