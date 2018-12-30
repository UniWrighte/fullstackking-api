require("dotenv").load();

const express = require("express");
const router = express.Router();
const db = require("../models");
const stripe = require("stripe")(process.env.STRIPE_KEY)

const bcrypt = require("bcrypt");

const {idParse, randStr} = require("../logic/helpers");
const {getJob, getJobs, addJob, updateJob, deleteJob, completeJob} = require("../logic/job");
const {addBid, getBids, getBid, acceptBid, removeBid} = require("../logic/bid");
const {addUserToSession, binMessageSession, getMessageSessions, startMessageSession,
        getMessagesBySession, sendMessage, clearMessage, getMissingMessageData} = require("../logic/message");
const {getUserFromToken, updateUser, getUserProfile, profileView,
     searchForUser, uploadProfileImage, userReviews, getNewStuff,
      clearNotifs, getPostedJobs, getRecentMessages, updatePass} = require("../logic/user");
const {generalSearch, searchJobs, activeUserJobs, userExists} = require("../logic/search");
const {pay, payout} = require("../logic/payment");
const {sendVerify} = require("../logic/misc");

router.route("/").get(async function(req,res){

    return res.status(200).json({
        message: "worked!"
    });
});

router.route("/resend/verify").get(async function(req,res,next){
    try{
        console.log("activated");
        const uid = req.baseUrl.split("/")[2];
        const [user, randomStr] = await Promise.all([db.User.findById(uid), randStr(next)]);
        const {email} = user;
        user.activateStr = randomStr;
        const [answer, u] = await Promise.all([sendVerify(randomStr, email, next), user.save()]);
        console.log(answer);
        return answer.accepted.length === 1 ? res.status(200).json({message: "success"})
                                            : next();
    }catch(err){
        return next(err);
    }
});

router.route("/payment").post(pay);
router.route("/payout").post(payout);

router.route("/add/job").post(addJob);
router.route("/job").post(getJobs);
router.route("/job/:job_id").get(getJob);
router.route("/job/update").post(updateJob);
router.route("/deactivate/job").post(deleteJob);
router.route("/confirm/complete/job").post(completeJob);

router.route("/review/:uid").get(userReviews);


router.route("/get/profile/data").post(getUserProfile);
router.route("/get/user").get(getUserFromToken);
router.route("/update/user").post(updateUser);
router.route("/change/permission").post(profileView);
router.route("/search/user").post(searchForUser);
router.route("/notifs").get(getNewStuff);
router.route("/notifs/clear").get(clearNotifs);
router.route("/update/pass").post(updatePass);

router.route("/user/jobs").get(getPostedJobs);
router.route("/get/message/sessions/recent").get(getRecentMessages);

router.route("/search/all").post(generalSearch);
router.route("/search/jobs").post(searchJobs);
router.route("/search/jobs/my").get(activeUserJobs);//this name is actually kind of not accurate. Currently returning all of user's jobs both active and inactive and bids.

router.route("/upload").post(uploadProfileImage);
router.route("/add/bid").post(addBid);
router.route("/get/user/bids").get(getBids);
router.route("/get/bid/:bid_id").get(getBid);
router.route("/accept/bid").post(acceptBid);
router.route("/delete/bid").delete(removeBid);


router.route("/add/message/new").post(startMessageSession);
router.route("/get/message/sessions").get(getMessageSessions);
router.route("/send/message").post(sendMessage);
router.route("/get/message/session").post(getMessagesBySession);
router.route("/user/exists/:username").get(userExists);
router.route("/add/message/user").post(addUserToSession);
router.route("/bin/message/session").post(binMessageSession);
router.route("/deactivate/message/session").post(clearMessage);
router.route("/fix/user").post(getMissingMessageData);

module.exports = router;
