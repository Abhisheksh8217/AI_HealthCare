let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('[Email] nodemailer is not installed. Emails will be logged to the console.');
}

const sendVerificationEmail = async (email, name, token) => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const url = `${backendUrl}/api/auth/verify?token=${token}`;
  
  console.log('\n==================================================');
  console.log(`📧  [EMAIL VERIFICATION] Link for ${name} (${email}):`);
  console.log(`🔗  Link: ${url}`);
  console.log('==================================================\n');

  if (nodemailer && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await transporter.sendMail({
        from: `"HealthCare App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your HealthCare App Account',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Welcome to HealthCare App, ${name}!</h2>
            <p>Please click the button below to verify your email address and activate your account:</p>
            <a href="${url}" style="display: inline-block; padding: 10px 20px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">Verify Email</a>
            <p>Or copy and paste this link in your browser:</p>
            <p><a href="${url}">${url}</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
            <p style="font-size: 12px; color: #888;">If you did not create this account, please ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[Email] Failed to send real email via Nodemailer:', err.message);
    }
  }
};

module.exports = { sendVerificationEmail };
