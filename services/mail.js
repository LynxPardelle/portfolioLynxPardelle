var nodemailer = require("nodemailer");

exports.DoSendEmail = async (mails) => {
  var transporterOne = nodemailer.createTransport({
    service: "gmail",
    // tsl
    // 465+
    // secure: true,
    // port: 465,
    auth: {
      user: "user@domain.com",
      pass: "password",
    },
  });

  for (let mail of mails) {
    var mailOptionsOne = {
      from: "user@domain.com",
      to: mail.to,
      subject: mail.title,
      text: mail.text,
      html: mail.html,
    };

    transporterOne.sendMail(mailOptionsOne, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }
};
