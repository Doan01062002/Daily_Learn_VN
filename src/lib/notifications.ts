/**
 * Abstract Notification & Email dispatch service.
 * In development mode, email payloads are logged to the console/stdout.
 * In production mode, this can be easily integrated with a provider like Resend or Nodemailer SMTP.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const { to, subject, html } = params;

  console.log("==========================================");
  console.log(`[Email Dispatch Service] Mode: ${process.env.NODE_ENV}`);
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log("------------------------------------------");
  // Strip HTML tags for clean console readable logs
  const plainText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  console.log(`Body:    ${plainText.slice(0, 150)}...`);
  console.log("==========================================");

  // In production, you would do:
  // const res = await fetch("https://api.resend.com/emails", { ... })
  // return res.ok;

  return true;
}
