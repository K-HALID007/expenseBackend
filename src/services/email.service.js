import nodemailer from "nodemailer";

export const sendOTPEmail = async (email, otp) => {
  try {
    console.log("📧 Sending email to:", email);
    console.log("📧 From:", process.env.EMAIL_USER);
    
    // Create transporter inside function
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD, // No spaces!
      },
    });

    const mailOptions = {
      from: `"Expense Tracker" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - Expense Tracker",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0F172A;">
          <div style="background-color: #22C55E; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">Expense Tracker</h1>
          </div>
          
          <div style="background-color: #1E293B; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #FFFFFF; margin-bottom: 20px;">Password Reset OTP</h2>
            
            <p style="color: #94A3B8; font-size: 16px; line-height: 1.6;">
              You requested to reset your password. Use the OTP below:
            </p>
            
            <div style="background-color: #334155; padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
              <span style="color: #22C55E; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                ${otp}
              </span>
            </div>
            
            <p style="color: #EF4444; font-size: 14px; margin-bottom: 20px;">
              ⚠️ This OTP will expire in 10 minutes.
            </p>
            
            <p style="color: #64748B; font-size: 14px; margin-top: 30px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully! Message ID:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Email error details:", error);
    throw new Error("Failed to send email");
  }
};