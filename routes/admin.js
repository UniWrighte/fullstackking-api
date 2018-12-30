const express = require("express");
const router = express.Router();
const db = require("../models");
const {unblockUser, blockUser, getSupportTickets, searchJobsAdmin, getPayouts, closePayout,
     lookupUser, closeSupportTicket, findJobById, recentJobs, postToBlog, getBlog} = require("../logic/admin");


router.route("/test").get(async function(req,res,next){
    try{
        console.log("works")
        return res.status(200).json({message: "test success"})
    }catch(err){
        return next(err);
    }
});
router.route("/recent/jobs/:num").get(recentJobs);
router.route("/search/jobs/id/:id").get(findJobById);
//may not be needed?
router.route("/search/jobs").post(searchJobsAdmin);
router.route("/support").get(getSupportTickets);
router.route("/support/close/:id").delete(closeSupportTicket);
router.route("/user").get(lookupUser);
router.route("/user/block").post(blockUser)
router.route("/user/unblock").post(unblockUser);

router.route("/payouts").get(getPayouts);
router.route("/payout/close/:id").delete(closePayout);

router.route("/post/blog").post(postToBlog);


module.exports = router;
