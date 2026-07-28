import nodemailer from "nodemailer";
import { config } from "../config";

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (config.smtp.host) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log("Using Ethereal test email account");
  }

  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: config.smtp.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    if (config.nodeEnv === "development") {
      console.log("Email sent:", nodemailer.getTestMessageUrl(info) || info.messageId);
    }
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

export function bookingRequestEmail(params: {
  therapistName: string;
  clientName: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
}): string {
  return `
    <h2>New Booking Request</h2>
    <p>Hi ${params.therapistName},</p>
    <p><strong>${params.clientName}</strong> has requested an appointment.</p>
    <ul>
      <li>Preferred date: ${params.preferredDate}</li>
      <li>Preferred time: ${params.preferredTime}</li>
      ${params.message ? `<li>Message: ${params.message}</li>` : ""}
    </ul>
    <p>Please log in to your dashboard to confirm or decline this request.</p>
  `;
}

export function bookingStatusEmail(params: {
  clientName: string;
  therapistName: string;
  status: string;
  note?: string;
}): string {
  return `
    <h2>Booking Update</h2>
    <p>Hi ${params.clientName},</p>
    <p>Your booking request with <strong>${params.therapistName}</strong> has been <strong>${params.status}</strong>.</p>
    ${params.note ? `<p>Note from therapist: ${params.note}</p>` : ""}
  `;
}

export function therapistApprovedEmail(params: { name: string }): string {
  return `
    <h2>Profile Approved</h2>
    <p>Hi ${params.name},</p>
    <p>Your therapist profile has been approved and is now visible in our directory.</p>
  `;
}

export function passwordResetEmail(params: { name: string; resetUrl: string }): string {
  return `
    <h2>Password Reset</h2>
    <p>Hi ${params.name},</p>
    <p>Click the link below to reset your password (valid for 1 hour):</p>
    <p><a href="${params.resetUrl}">${params.resetUrl}</a></p>
  `;
}

export function bookingCompletedEmail(params: {
  clientName: string;
  therapistName: string;
  reviewUrl: string;
}): string {
  return `
    <h2>Session Complete — Share Your Experience</h2>
    <p>Hi ${params.clientName},</p>
    <p>Your session with <strong>${params.therapistName}</strong> has been marked as completed.</p>
    <p>We'd love to hear about your experience. Your review helps others find the right therapist.</p>
    <p><a href="${params.reviewUrl}">Leave a Review</a></p>
  `;
}

export function newMessageEmail(params: {
  recipientName: string;
  senderName: string;
  preview: string;
  messagesUrl: string;
}): string {
  return `
    <h2>New Message</h2>
    <p>Hi ${params.recipientName},</p>
    <p><strong>${params.senderName}</strong> sent you a message:</p>
    <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555;">${params.preview}</blockquote>
    <p><a href="${params.messagesUrl}">Open Messages</a></p>
  `;
}
