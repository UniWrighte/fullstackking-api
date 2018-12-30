require("dotenv").load();
const db = require("../models");
const {idParse} = require("../logic/helpers");

exports.completeJob = async function(req,res,next){
    try{
        const user = req.baseUrl.split("/")[2];
        const {isRated, job} = req.body;
        // console.log(isRated); //possibly look into using a helper function to check for should be bools and turn them from strings or 1/0's to bools.
        // const isRated_bool = isRated === "true";
        // console.log('bool', isRated_bool);
        let job_obj = await db.Job.findById(job).populate("accepted_bid");

        if(job_obj.verified && !!job_obj.accepted_bid && user+"" === job_obj.user+"" && !job_obj.completed && job_obj.active ){

        if(isRated && !job_obj.review_id){ //may need further tests.
            const {review, is_good} = req.body;

            // const bool_good = is_good === "true";
            let r = await db.Review.create({
                review,
                positive: is_good,
                user_by: job_obj.user,
                user_to : job_obj.accepted_bid.user,
                job
            });

                await job_obj.update({review_id: r._id, completed: true, active: false});

        }else{
            await db.Job.update({_id: job}, {completed: true, active: false});
        }
	const user_by = await db.User.findById(job_obj.accepted_bid.user);
 	user_by.total_amount += job_obj.amount; //add some sort of verificiation so users don't see same amount.
        await user_by.save();
	return res.status(200).json({message: "job completed"});
        }else{
            return res.status(400).json({error: "payment invalid"});
        }

    }catch(err){
        return next(err);
    }
}

exports.deleteJob = async function(req, res, next){
    try{
        const {job_id} = req.body;

        // const job = await db.Job.findById(job_id).populate({path: "bids"});
        // const user = await idParse(req.headers.authorization.split(" ")[1]);

        const [job, user] = await Promise.all([db.Job.findById(job_id).populate({path: "bids"}), idParse(req.headers.authorization.split(" ")[1])]);

        //TODO - there needs to be a catch for jobs that have been paid here.
        if(job.user+"" === user+"" && !job.accepted_bid){
            await job.bids.forEach( async (bid)=>{
                await db.Bid.update({_id: bid}, {active: false, date_inactive: new Date()});

            });
            await job.update({active: false, date_inactive: new Date()}).exec();

            return res.status(200).json({job_deactivated: job_id});
        }
        if(job.accepted_bid){
            return res.status(200).json({job_active_bid_exists: job_id});
        }
        return res.status(400).json({error: "error occured in update"});
    }catch(err){
        return next(err);
    }
}

exports.addJob = async function(req,res,next){

try{
    let {title, front, back, require, description, contract, amount} = req.body;

    const id = req.baseUrl.split("/")[2];

    if(title.length >= 10 && title.length < 51 && description.length < 5001 && description.length >= 100 && amount > 4){


        let job = await db.Job.create({
            user: id,
            title: title,
            front_end: front,
            back_end: back,
            configuration_required: require,
            description: description,
            contract,
            amount

        });

        let result = {
            title: job.title,
            user : job.user,
            description: job.description,
            id: job._id,
            amount: job.amount
        }

    return res.status(200).json(result);
    }else{
    return res.status(400).json({
        message: "Title needs 10 characters, description at least 100, amount needs to be greater than $20.00"
    });
    }
}catch(err){
    return next(err);
}
}

exports.getJobs = async function(req, res, next){

    try{
        const {before} = req.body;

        let jobs = await db.Job.find({active: true, date: {$lte: before}})
                .limit(6).select("amount active bids completed contract date front_end back_end configuration_required title verified")
                .sort('-date');

        return res.status(200).json(jobs);
    }catch(err){
        return next(err);
    }

}
exports.updateJob = async function(req, res, next){
    try{

        const {job_id, ...items} = req.body;
        const user = req.baseUrl.split("/")[2];
        if(typeof items.user === 'undefined' && typeof items.bids === 'undefined' && typeof items.active === 'undefined'){
            const query =  await db.Job.findOneAndUpdate({_id: job_id, user: user}, {...items}, {new: true}, (err, doc)=>{
                if(err)return res.status(400).json({error: "there was a problem updating the database"});
            })
            return res.status(200).json(query);
        }else{
            return res.status(400).json({error: "unsupported fields"});
        }
        return res.status(200).json({message: "a fall through occured, you probably aren't authorized to perform that action."})
    }catch(err){
        return next(err);
    }
}
exports.getJob = async function(req, res, next){
    try{
        const uid = req.baseUrl.split("/")[2];
        const {job_id} = req.params;
        //should make this query dependent on another param sent if db calls get too heavy.
        await db.User.findById(uid).exec(async (err, user)=>{
            if(err)return next(err);
            let notifs_type = []
            user.notifs_id = user.notifs_id.filter((id, index)=>{
                const keep = (id+"" !== job_id);
                keep && notifs_type.push(user.notifs_type[index]);
                return keep;
            });
            user.notifs_type = notifs_type;
            await user.save(); //I may not need the await on these. or the async above;

        });

        let job = await db.Job.findById(job_id).populate({path: "user", select:"-password"}).populate({path: "bids", populate: {path:"user", select: "-password"}});
        let {bids, user, _id, back_end, front_end, date,
            configuration_required, description, title, accepted_bid, verified, contract, amount, review_id, completed} = job;

        let filteredBids = bids.map((bid)=>{
            const {_id, title, details, user, amount, back, front} = bid;
            const {username, firstname, lastname} = bid.user;
            const user_id = bid.user._id
            return {_id, title, details, amount, back, front, date, user:{username, firstname, lastname, _id: user_id}};
        })
        let {username, firstname} =  user;
        const job_poster_id = user._id;

        let filteredJob = {bids: filteredBids, user: {username, firstname, _id: job_poster_id}, _id, back_end, front_end,
            configuration_required, description, title, accepted_bid, verified, contract, amount, review_id, completed, date}
        return res.status(200).json(filteredJob);
    }catch(err){
        return next(err);
    }
}
