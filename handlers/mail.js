const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require("juice");
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

const generateHTML = (filename, options={}) => {
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
    // console.log(html);
    //this inline make all css in one line
    const inlined = juice(html);
    return inlined;
}

exports.send = async (options) => {
    const html = generateHTML(options.filename, options);
    const text = htmlToText.fromString(html);
    const mailOptions = {
        from: 'Jake Long <no-reply@mailtrap.com>',
        to: options.user.email,
        subject: options.subject,
        html,
        text
    };
    const sendMail = promisify(transport.sendMail, transport);
    return sendMail(mailOptions);
}; 

// TO CHECK THE MAILTRAP IS WORKING
// transport.sendMail({
//     from: 'Jake Long <no-reply@mailtrap.com>',
//     to: 'jakelong@example.com',
//     subject: 'Just trying to learn sending mail!',
//     html: 'Hey, I <b>received the mail</b> in my mailtrap inbox',
//     text: 'Hey, I **received the mail** in my mailtrap inbox'
// });
// now require this file in start.js 
// require('./handlers/mail');

