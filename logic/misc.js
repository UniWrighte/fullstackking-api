require('dotenv').load();

const db = require("../models");
const {idParse, sendEmail} = require("./helpers");
const nodemailer = require("nodemailer"); //can be removed. placed for temporary completeism.


exports.sendVerify = async function(randomStr, to, next){
    try{

        const url = `${process.env.URL}/activate/${randomStr}`;
        const html =
        `
        <html>
        <body style="color: rgba(28, 17, 104, 1);">
        <h1> Welcome to fullstackking.com </h1>
        <p> To activate your email, follow this link: ${url}</p>
        </body>
        </html>
        `
        const subject = "Welcome to Fullstackking";
        const test = sendEmail(html, subject, to, process.env.PASS); // should this have await? will it return a promise?
        console.log(test);
        return test;
    }catch(err){
        return next(err);
    }
}

exports.supportTicket = async function(req,res,next){
    try{

        const {title, description, select, email} = req.body;

        db.Support.create({
            description,
            title,
            select,
            email
        }).then(()=>{
            return res.status(200).json({message: "success"});
        })


    }catch(err){
        return next(err)
    }
};

exports.resetSubmit = async function(req,res,next){
    try{
        //reset function for pass recovery
        //this may need to be jwt...
        const {hash, pass, np} = req.body;
        const id = await idParse(req.headers.authorization.split(" ")[1]);
        const user = await db.User.findById(id);
        const passedTime = (new Date()).getTime() - (new Date(user.resetReqTime)).getTime()
        if(user.resetPass && passedTime < 3600000){
            //expires after an hour.
            const compare = bcrypt.compare(pass, user.resetPassHash);
            if(compare){
                user.password = np;
                 await user.save(); //await may not be needed.
            }
            return compare ? res.status(200).json({message: "password reset success"}) :
                            res.status(200).json({message: "password incorrect"});
        }else{
            return res.status(400).json({error: "password not set. Error occured. New email required"});
        }

    }catch(err){
        return next(err);
    }
};
exports.resetPass = async function(req, res, next){
    try{
        const {email, ln, fn} = req.body;
        const user = await db.User.findOne({email});

        if(ln === user.lastname && fn === user.firstname){

        const num =  -1 * (Math.floor(Math.random() * (11 - 8)) + 8);
        const pass = Math.random().toString(36).slice(num).toUpperCase();
        user.resetPass = true;
        user.resetReqTime = new Date();
        const [token, rph, idHash] = await Promise.all([signReset(user._id, next), bcrypt.hash(pass, 10), bcrypt.hash(user._id + "", 10)]);

        user.resetPassHash = rph;
        user.save();

        const url = `${process.env.URL}/onboarding/reset/${idHash}`
        const html = `<html>
        <body style="color: rgba(28, 17, 104, 1);">
        <h3>fullstackking.com password reset</h3>
        <h1>Password Reset Requested</h1>
        <h3>Please contact support if you haven't requested a password reset<h3>
        <p>Here is your temporary password: </p>
        <h3 style="color: rgba(175, 182, 110, 1);"> ${pass} </h3>
        <p>navigate to this url: <a href="${url}"> ${url} </a> in the same browser you requested the reset from.</p>
        <p> Thank's for using fullstackking! </p>
        <p> fullstackking.com team and supporters </p>
        </body>
        </html>`;

        const success = await sendEmail(html, "Password Reset", email, process.env.PASS);
        if(success = "success"){
            return res.status(200).json({message: "email sent"});
        }else{
            return next(success);
        }
    }else{
        return res.status(200).json({message: "email not sent"});
    }

    }catch(err){
        return next(err);
    }
}
