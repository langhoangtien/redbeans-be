import nodemailer from "nodemailer";

// Cấu hình transporter với tài khoản Gmail
const transporter = nodemailer.createTransport({
  service: "Zoho",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface ISendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: ISendEmailOptions): Promise<void> {
  console.log("Sending email to:", to);

  try {
    const info = await transporter.sendMail({
      from: `"QuitMood" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Email đã gửi:", info.messageId);
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
  }
}

// Gọi thử hàm gửi email
