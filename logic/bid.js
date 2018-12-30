require("dotenv").load();
const db = require("../models");
const {idParse} = require("../logic/helpers");


exports.acceptBid = async function(req,res,next){
    try{
        const {_id} = req.body;
        const bid = await db.Bid.findById(_id).populate({path: "job"});
        const user = await idParse(req.headers.authorization.split(" ")[1]);

        if(bid.job.user + "" === user+""){

            if(bid.job.accepted_bid !== undefined){
            const oldBid = await db.Bid.findById(bid.job.accepted_bid);
            await oldBid.update({accepted: false});
            await oldBid.save();
            //send message that accepted bid was retracted.
            }
            await bid.update({accepted: true});
            await bid.save();

	    const amount = bid.amount - (bid.amount * .1);
            const updatedJob = db.Job.findOneAndUpdate({_id: bid.job._id}, {accepted_bid: _id, amount}, {new: true}, (err, doc)=>{
                if(err) return res.status(400).json({error: err});

            })

            //send message that bid was accepted
            const userOwner = await db.User.findById(user);
            const userAccepted = await db.User.findById(bid.user);
            const newSess = await db.MessageSession.create({users: [userAccepted, userOwner]});
            const {id} = newSess
            await db.Message.create({
                session: id,
                user,
                text: `Your bid has been accepted!!!🎉🎉🎉 (this message was automatically sent by the system)-${bid.job._id}`
                });

            res.status(200).json({session: id});
        }else{
            res.status(400).json({message: "unauthorized"});
        }
    }catch(err){
        return next(err);
    }
}

exports.addBid = async function(req,res,next){
    try{
        let {title, back, front, details, job, amount} = req.body;

        const token = req.headers.authorization.split(" ")[1];
        const user = await idParse(token);

        const jobInfo = await db.Job.findById(job);

        //add check for job id in user's bidded on jobs.
        let isSameuser = user+"" === jobInfo.user+"";

        if(details.length > 50 && !isSameuser){


            let bid = await db.Bid.create({
                user,
                job,
                title,
                back,
                front,
                details,
                amount
            });

            return res.status(200).json(bid);
        }else{
            return res.status(400).json({
                message: "Bid doesn't meet quality standards"
            });
        }


    }catch(err){
        return next(err);
    }
}
exports.getBids = async function(req, res, next){
    try{
        const token = req.headers.authorization.split(" ")[1];
        const u_id = await idParse(token);
        let user = await db.User.findById(u_id).populate("bids");
        const {bids} = user;
        return res.status(200).json(bids);

    }catch(err){
        return next(err);
    }
}
exports.getBid = async function(req, res, next){
    try{
        const bid = await db.Bid.findById(req.params.bid_id);
        return res.status(200).json(bid);
    }catch(err){
        return next(err);
    }
}
exports.removeBid = async function(req, res, next){
    try{
        const {bid_id} = req.body;

        const user = await idParse(req.headers.authorization.split(" ")[1]);
        const bid = await db.Bid.findById(bid_id);

        if(bid.user+"" === user+""){
            await db.Job.update({_id: bid.job},
                {$pull:  {bids: bid_id }});
            await db.User.update({_id: bid.user},
                {$pull: {bids: bid_id }});
                bid.remove();
        }else{
            return res.status(400).json({error: "unauthorized"});
        }
        return res.status(200).json({removed_bid: bid_id});
    }catch(err){
        return next(err);
    }
}
