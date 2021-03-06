import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method === "POST") {
    /*
    This function is handling http POST request to path /api/email/invite, to
    send a validation email to the mail-box of the new registered user
    1. Get the email, username, validate_id from the request body.
    2. Construct the validation link and email
    3. Send the email
    */
    const { email, username, validate_id } = req.body;

    const url = `https://sing-k-app.vercel.app/login/activate-account?validate_id=${validate_id}`
  
    var message = {
      from: "enjoy.singing.karaoke@gmail.com",
      to: email,
      subject: "Activate your karaoke account at sing-k-app.vercel.app",
      text:`Welcome ${username},\n\nClick the below link to activate your account:\n${url}\n\n-- Karaoke App Team`,
    };

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: 'enjoy.singing.karaoke@gmail.com',
          pass: process.env.EMAIL_PW
      }
    });
    
    await transporter.sendMail(message);

    return res.status(200).json({
      message: `Sent activation email to ${email}.`
    });
  }
}