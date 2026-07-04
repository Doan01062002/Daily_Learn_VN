import nodemailer from "nodemailer";

/**
 * Abstract Notification & Email dispatch service.
 * Supports SMTP (Nodemailer), Resend API, and Mock terminal logging in development.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const { to, subject, html } = params;

  // 1. If SMTP environment variables are present, dispatch via SMTP (Nodemailer)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const isSecure = process.env.SMTP_SECURE === "true";
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: isSecure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || `"Daily Learn VN" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[Email Dispatch Service] Real email dispatched successfully via SMTP to: ${to}`);
      return true;
    } catch (error) {
      console.error("[Email Dispatch Service] SMTP error sending email:", error);
    }
  }

  // 2. If RESEND_API_KEY is provided in .env, dispatch via Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Daily Learn VN <onboarding@resend.dev>",
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      if (response.ok) {
        console.log(`[Email Dispatch Service] Real email dispatched successfully via Resend to: ${to}`);
        return true;
      } else {
        const errorData = await response.json();
        console.error("[Email Dispatch Service] Resend API returned error:", errorData);
      }
    } catch (error) {
      console.error("[Email Dispatch Service] Network error sending via Resend:", error);
    }
  }

  // 3. Fallback to local console logging in development
  console.log("==========================================");
  console.log(`[Email Dispatch Service] Mode: ${process.env.NODE_ENV} (Mock Fallback)`);
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log("------------------------------------------");
  // Strip HTML tags for clean console readable logs
  const plainText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  console.log(`Body:    ${plainText}`);
  console.log("==========================================");

  return true;
}
