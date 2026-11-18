import { Resend } from 'resend'

// ---------------------------------------------------------------------------
// Email service (Resend)
// If RESEND_API_KEY is not set (e.g. local dev), emails are logged to console
// instead of sent — so flows are testable without a real provider.
// ---------------------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || 'Nexora <onboarding@resend.dev>'

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.log(`[email:dev] To: ${to} | Subject: ${subject}`)
    const link = html.match(/https?:\/\/[^\s"]+reset-password[^\s"]*/)
    if (link) console.log(`[email:dev] Reset link: ${link[0]}`)
    else console.log(`[email:dev] ${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)}`)
    return { delivered: false, dev: true }
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to: [to], subject, html })
    if (error) {
      console.error('Email send error:', error.message)
      return { delivered: false, error: error.message }
    }
    return { delivered: true, id: data?.id }
  } catch (err) {
    console.error('Email send failed:', err.message)
    return { delivered: false, error: err.message }
  }
}

export function sendPasswordResetEmail(to, resetLink) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#10b981;">Nexora — Password Reset</h2>
      <p>We received a request to reset your password. Click the button below to choose a new one:</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${resetLink}"
           style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
      </p>
      <p style="font-size:13px;color:#64748b;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
      <p style="font-size:12px;color:#94a3b8;">Nexora · If the button doesn't work, copy this link into your browser:<br>${resetLink}</p>
    </div>`
  return sendEmail({ to, subject: 'Reset your Nexora password', html })
}

export function sendDepositConfirmedEmail(to, amount, asset) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#10b981;">Deposit Confirmed</h2>
      <p>Your deposit of <strong>${amount} ${asset}</strong> has been confirmed and added to your Nexora balance.</p>
      <p style="font-size:13px;color:#64748b;">You can now invest or withdraw from your available balance.</p>
    </div>`
  return sendEmail({ to, subject: 'Your deposit was confirmed', html })
}

export function sendVerificationEmail(to, verifyLink) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#10b981;">Welcome to Nexora — Verify Your Email</h2>
      <p>Thanks for signing up. Click the button below to verify your email address and activate your account:</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${verifyLink}"
           style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Verify Email
        </a>
      </p>
      <p style="font-size:13px;color:#64748b;">This link expires in 24 hours. If you didn't sign up, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
      <p style="font-size:12px;color:#94a3b8;">Nexora · If the button doesn't work, copy this link into your browser:<br>${verifyLink}</p>
    </div>`
  return sendEmail({ to, subject: 'Verify your Nexora email', html })
}
export function sendWithdrawalStatusEmail(to, amount, asset, status, reason) {
  const released = status === 'released'
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:${released ? '#10b981' : '#ef4444'};">Withdrawal ${released ? 'Released' : 'Rejected'}</h2>
      <p>Your withdrawal of <strong>${amount} ${asset}</strong> has been ${released ? 'released and is on its way to your wallet' : 'rejected'}.</p>
      ${reason ? `<p style="font-size:13px;color:#64748b;">Reason: ${reason}</p>` : ''}
    </div>`
  return sendEmail({ to, subject: `Withdrawal ${released ? 'released' : 'rejected'}`, html })
}