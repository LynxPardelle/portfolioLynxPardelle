var nodemailer = require("nodemailer");

exports.DoSendEmail = async (mails) => {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    /* tsl 
    465+ 
    secure: true, 
    port: 465, */
    auth: {
      user: "lnxdrk@gmail.com",
      pass: "lyxunfprfzcfaenv",
    },
  });

  for (let mail of mails) {
    var mailOptions = {
      from: "lynxpardelle@lynxpardelle.com",
      to: mail.to,
      subject: mail.title,
      text: mail.text,
      html: mail.html,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }
};
