const nodemailer = require('nodemailer');

// Create email transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'forallhomecare@gmail.com',
    pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password
  }
});

/**
 * Send email notification when new appointment is requested
 */
async function sendNewAppointmentNotification(appointment) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'forallhomecare@gmail.com',
      to: 'forallhomecare@gmail.com',
      subject: '🆕 New Home Visit Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">New Home Visit Request</h2>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1F2937;">Client Information</h3>
            <p><strong>Name:</strong> ${appointment.name}</p>
            <p><strong>Email:</strong> ${appointment.email}</p>
            <p><strong>Phone:</strong> ${appointment.phone}</p>
            <p><strong>Address:</strong> ${appointment.address}</p>
          </div>
          
          <div style="background-color: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4F46E5;">Appointment Details</h3>
            <p><strong>Preferred Date:</strong> ${new Date(appointment.requestedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Preferred Time:</strong> ${appointment.requestedTime}</p>
            ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
          </div>
          
          <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⏰ Status:</strong> Pending - Please confirm or decline this appointment</p>
          </div>
          
          <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
            Submitted: ${new Date(appointment.submittedAt).toLocaleString()}
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email notification sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email notification:', error.message);
    // Don't throw error - we don't want email failures to stop appointment creation
    return null;
  }
}

module.exports = {
  sendNewAppointmentNotification
};
