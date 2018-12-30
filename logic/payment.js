
require("dotenv").load();
const stripe = require("stripe")(process.env.STRIPE_API_KEY); //not tested
const bcrypt = require("bcrypt");
const {idParse} = require("../logic/helpers");
const db = require("../models");

exports.payout = async function(req, res, next){
    try{
        const uid = await idParse(req.headers.authorization.split(" ")[1]);
        const {type, account, routing} = req.body;
        const user = await db.User.findById(uid);
        //all subtractions will be handled manually from an admin consel for now.
        //add bool so that payout can only be triggered once until reset.
        user.payment_request = true;

        if(type === "bank"){
            await db.Payout.create({
                type,
                account,
                routing,
                user
            })
        }else{
            await db.Payout.create({
                type,
                account,
                user
            })
        }
        await user.save();
        return res.status(200).json({message: "processing started"})
    }catch(err){
        return next(err);
    }
}

exports.pay = async function(req,res,next){
    try{
    const {source, job} = req.body;//amount should be conditionaly on existence of accepted bid.
    const user = await idParse(req.headers.authorization.split(" ")[1]);
    const curr_job = await db.Job.findById(job).populate('accepted_bid');
    if(!!curr_job.verified) return res.status(400).json({message: "already verified"});
    console.log(source); //needs removed but works.
    const real_amount = !!curr_job.accepted_bid ? curr_job.accepted_bid.amount : curr_job.amount;
    //someone is changing my shit to make a security loophole to force payouts that aren't paid in.
    //the bellow code was likely changed to no use real_amount. it has been fixed.
    const charge = stripe.charges.create({
        amount: real_amount * 100 + "",
        currency: 'usd',
        description: job,
        source //will need to be switched back after I'm done having my fucking time wasted. :D
    })
    charge.then((item)=>{
        if(item.status === "succeeded")
        {
            if(item.outcome.seller_message !== 'Payment complete.'){
                //process as pending.
                db.Payment.create({
	            amount: real_amount,
                    user,
                    job,
                    charge_id: item.id,
                    complete: false
                });
                return res.status(200).json({message: "pending"});
            }

             db.Payment.create({
                 amount: real_amount,
                 user,
                 job,
                 charge_id: item.id,
                 complete: true
             });
             return res.status(200).json({message: "ok"});
        }
        return res.status(400).json({error: "card failure"});
    }).catch((err)=>{
        console.log(err);
        return res.status(400).json({error: "card failure caught"});
    })
    }catch(err){
        return next(err);
    }
}
