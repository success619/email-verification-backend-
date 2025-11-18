require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(express.json());
app.use(cors());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

let emailVerifyingUsers = []; //This just for development and testing, perhaps you can store it in database
//since it always lost its values when server restarted

app.post("/generate-email-verification-code", (req, res) => {
  const { email } = req.body;
  try {
    const generatedCode = String(Math.random())
      .replace("0.", "")
      .substring(0, 6);

    let filterdUser = emailVerifyingUsers.filter((f) => f.email === email);
    if (filterdUser.email) {
      res.status(400).json({
        generated: false,
        sent: false,
        message: `already sent`,
      });
      return;
    }
    emailVerifyingUsers.push({ email, code: generatedCode });

    transporter.sendMail(
      {
        from: process.env.GMAIL_PASS,
        to: email,
        subject: `company_name Verification code: ${generatedCode}`,
        html: `
        <html>
        <head>
            <style>
            body { font-family: sans-serif; }
            .container { padding: 20px; background-color: #f4f4f4; }
            .header { color: #120435ff; }
            </style>
        </head>
        <body>
            <div class="container">
            <h1 class="header">verify your email!</h1>
            <p>Use this code to verify your email address:</p>
            <h1 class="header">${generatedCode}</h1>
             <p> Do not disclose this to anyone, not even company_name will call for the code.</p>
              <p> This code will expire in 30 minutes.
                Beware of fraud
                If you don’t recognize ${email}, you can safely ignore this email.</p>
            <a href="http://yourwebsite.com">Visit our website</a>
            </div>
        </body>
        </html>
  `, // HTML body content,
      },
      (err, info) => {
        if (err) {
          res.status(400).json({
            generated: false,
            sent: false,
            message: `error generating code`,
          });
          return;
        }
        res
          .status(200)
          .json({ generated: true, sent: true, message: `success` });
      }
    );
  } catch (error) {
    res.status(400).json({
      generated: false,
      sent: false,
      message: `error generating code`,
    });
  }
});

app.post("/verify-email-verification-code", async (req, res) => {
  const { email, code } = req.body;
  let filterdUser = emailVerifyingUsers.filter((f) => f.email === email);
  const isVerified = filterdUser.code === code.toString();
  const removeVerifiedUser = () =>
    (emailVerifyingUsers = emailVerifyingUsers.filter(
      (f) => f.email !== email
    ));
  if (isVerified) {
    removeVerifiedUser();
    res.status(200).json({ verified: true });
  } else res.status(400).json({ verified: false, message: `code not match` });
});

app.listen(3000, () => console.log(`app is running in port 3000`));
