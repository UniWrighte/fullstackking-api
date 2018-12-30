const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const {signup, signin, signReset, adminSignin} = require("../logic/auth");
const {checkEmail, checkUser} = require("../logic/unique");
const {Authenticate, Authorize} = require("../middleware/verify");
const {idParse} = require("../logic/helpers");
const {supportTicket, resetSubmit, resetPass} = require("../logic/misc")
const db = require("../models");


router.get("/test", async function(req,res,next){
    try{
    const test = await db.Admin.findById("5b2d41c91e60cd126a51a9c4");
    return res.status(200).json(test);
    }catch(err){
        return next(err);
    }
})

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signin/admin", adminSignin);

router.post("/unique/email", checkEmail);
router.post("/unique/username", checkUser);
router.post("/support", supportTicket);

router.post("/reset/submit", resetSubmit);


router.post("/reset", resetPass);

router.post("/verify", async function(req, res, next){
    try{
        const {activateStr, email} = req.body;
        const user = await db.User.findOne({email});
        const success = user.activateStr === activateStr;

        if(success){
            user.verified = true;
            await user.save();
            return res.status(200).json({message: "success"});
        }else{
            return res.status(400).json({error: "incorrect paramater for email"})
        }

    }catch(err){
        return next(err);
    }
});

router.get("/blogs", async function(req,res,next){
    try{
        const blogs = await db.Blog.find({show: true}).select("title date content author_name");

        return res.status(200).json({blogs});
    }catch(err){
        return next(err);
    }
})

module.exports = router;
