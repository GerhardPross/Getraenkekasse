import nodemailer from 'nodemailer';
import {convert} from 'html-to-text';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.host,
  port: process.env.port,
  auth: { 
    user: process.env.email_user, 
    pass: process.env.email_pass },
}); 

const sendEmail = async (to, subject, text) => {

    const plainText = text || convert(html, {
        wordwrap: 130,
      });

    try{
  const info = await transporter.sendMail({
    from: process.env.email_from,
    to,
    subject,
    text: plainText,
    html: text
  });
  
  console.log(' Email gesendet: %s', info.messageId);
    } catch (error) { 
    console.error ('Fehler beim Versenden der Email', error)
    }
};

export default sendEmail;