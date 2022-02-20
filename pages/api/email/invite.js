import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email, username, validate_id } = req.body;

    const url = (process.env.NODE_ENV === 'development' ? 
          `localhost:3000/login?validate_id=${validate_id}` : 
          `https://sing-k-app.vercel.app/login?validate_id=${validate_id}`);
  
    var message = {
      from: "enjoy.singing.karaoke@gmail.com",
      to: email,
      subject: "Activate your karaoke account at sing-k-app.vercel.app",
      text:`Hi ${username},\n\nClick the below link to activate your account:\n${url}\n\n-- Karaoke App Team`,
    };

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: 'enjoy.singing.karaoke@gmail.com',
          pass: 'Kawai@t32'
      }
    });
    
    transporter.sendMail(message);

    return res.status(200).json({
      message: `Sent activation email to ${email}.`
    });
  }
}