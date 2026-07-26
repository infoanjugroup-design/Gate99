
const axios = require('axios');
const { email } = require('./config');

/* ---------------- Brevo (HTTP API) email sending ----------------
   Render's free web services block ALL outbound SMTP traffic (ports
   25, 465, 587) as of Sept 2025 — see:
   https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports
   Gmail SMTP (nodemailer) can therefore NEVER connect from a free
   Render service, no matter how correct the App Password is — the
   connection is blocked at the network level before auth is even
   attempted. Brevo's API runs over plain HTTPS (port 443), which is
   NOT blocked, so we use that instead of SMTP.
   Free Brevo plan: 300 emails/day, no card required. */

function getBrevoKey() {
  return email.brevoApiKey || null;
}

// purpose-specific templates — never reuse one template for a
// different purpose, so an OTP email never reads like a bill or a
// generic notice.
const TEMPLATES = {
  login: (otp) => ({ subject: 'GATE99 — Your login OTP', body: `Your OTP to log in to GATE99 is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.` }),
  studentRegister: (otp) => ({ subject: 'GATE99 — Verify your registration', body: `Your OTP to complete registration on GATE99 is: ${otp}\n\nThis code expires in 10 minutes.` }),
  adminLogin: (otp) => ({ subject: 'GATE99 Staff — Your login OTP', body: `Your OTP to log in to the GATE99 Admin Panel is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.` }),
  forgotPassword: (otp) => ({ subject: 'GATE99 Staff — Reset your password', body: `Your OTP to reset your GATE99 Admin Panel password is: ${otp}\n\nIf you did not request this, ignore this email.` }),
};

function emailTemplate(purpose, otp) {
  const fn = TEMPLATES[purpose];
  return fn ? fn(otp) : { subject: 'GATE99 — OTP', body: `Your OTP is: ${otp}` };
}

async function sendViaBrevo(to, subject, text) {
  const key = getBrevoKey();
  if (!key) throw new Error('Email is not configured — set BREVO_API_KEY (and EMAIL_USER as the verified sender) in Render env vars.');
  await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: { name: email.fromName, email: email.user },
      to: [{ email: to }],
      subject,
      textContent: text,
    },
    {
      headers: { 'api-key': key, 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 20000,
    }
  );
}

async function sendOtpEmail(to, purpose, otp) {
  const tpl = emailTemplate(purpose, otp);
  try {
    await sendViaBrevo(to, tpl.subject, tpl.body);
  } catch (e) {
    const msg = e.response?.data?.message || e.message;
    throw new Error(msg);
  }
}

async function sendPlainEmail(to, subject, body) {
  try {
    await sendViaBrevo(to, subject, body);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { sendOtpEmail, sendPlainEmail };
