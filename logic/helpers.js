require("dotenv").load();

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");


exports.idParse = async function(token){
try{
    let id = 0;
    jwt.verify(token, process.env.SECRET_KEY, function(err, decode){
        id = decode.id;
        //might need to make sure it isn't a reset token. add another method for resets.
    })
    if(id){
        return id;
    }else{
        return "error occured parsing id from token";
    }
}catch(err){
    return err;
}
}
exports.sendEmail = async function(html, subject, to, pass,
     from = process.env.DEFAULT_EMAIL, host = process.env.DEFAULT_HOST){
    try{
        const transporter = nodemailer.createTransport({
            service: 'SMTP',
            host,
            auth: {
                user: from,
                pass
            }

        });
        const mailOptions = {
            from,
            to,
            subject,
            html
        }
        return transporter.sendMail(mailOptions)

    }catch(err){
        return err
    }
}
exports.randStr = async function(next){
    try{
        const num = -1 * (Math.floor(Math.random() * (11 - 8)) + 8);
        return Math.random().toString(36).slice(num).toUpperCase();
    }catch(err){
        return next(err);
    }
}
