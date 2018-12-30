require("dotenv").load();
const db = require("../models");
const {idParse} = require("../logic/helpers");
const readChunk = require('read-chunk');
const fileType = require('file-type');
const bcrypt = require('bcrypt');

exports.updatePass = async function(req,res,next){
    try{
    //move this to user file. for normal password changes.
    //doesn't need to check temp password and dates.
        const {np, pass} = req.body;
        const uid = req.baseUrl.split("/")[2];
        const user = await db.User.findById(uid);
            //probably should change this to the method in the user model and bcrypt removed. 
            const compare = bcrypt.compare(pass, user.password);
            if(compare){
                user.password = np;
                await user.save();

                return res.status(200).json({message: "password set"});
            }else{
                return res.status(400).json({error: "unauthorized"});
            }

    }catch(err){
        console.log(err);
        return next(err);
    }
};

exports.userReviews = async function(req,res,next){
    try{
        const {uid} = req.params;

        const u = await db.User.findById(uid).populate("reviews");
        const {reviews} = u;
        return res.status(200).json({reviews })
    }catch(err){
        return next(err);
    }
}
exports.getNewStuff = async function(req,res,next){
    try{
    const user = await idParse(req.headers.authorization.split(" ")[1]);

    const status = await db.User.findById(user);//may be able to use .select("notifs") at the end to directly access notifs.
    const {notifs_type, notifs_id, newNoEdit} = status;
    console.log(notifs_id);
    return res.status(200).json({notifs_type, notifs_id, newNoEdit});
    }catch(err){
    return next(err);
    }
    //clears when navigating to page .
}
exports.clearNotifs = async function(req,res,next){
    try{
        const user = await idParse(req.headers.authorization.split(" ")[1]);
        // await db.User.update({_id: user}, {newStuff: ""});
        let user_obj = await db.User.update({_id: user}, {notifs_type: [], notifs_id:[]});


        return res.status(200).json({message: "all clear"});

    }catch(err){
        return next(err);
    }
}


//make sure to take out returning password hash
exports.getUserFromToken = async function(req, res, next){
    try{
        const token = req.headers.authorization.split(" ")[1];
        const u_id = await idParse(token);
        //select may be able to improve perfomance here.
        const user = await db.User.findById(u_id).populate({path: "jobs", select:"title date active", options: {limit: 10, sort: "-date"}})
        .populate({path: "bids", populate: {path:"job", select: "_id date active"}, options: {limit: 10, sort: "-date"}})
        .populate({path:"reviews", populate:{path:"user_by"}, options: {limit: 10, sort: "-date"}});
        const {email,username,firstname, lastname, description, photo, hide, verified,
             best_front, best_back, primary, phone, visibility, created, bids, jobs, total_amount, reviews, newNoEdit} = user;

             const filteredReviews = reviews.map((r)=>{
                 const {user_by, job, review, positive} = r;
                 const {username, photo, _id} = user_by;
                 return {user: {username, photo, _id}, job, review, positive};

             });

             const returnJobs = jobs.filter((job)=>{
                return job.active;
             })

        return res.status(200).json({total_amount, email, username, firstname, lastname, verified,
                                    description, photo, best_front, best_back, primary, hide,
                                    phone, visibility, created, bids, newNoEdit, jobs: returnJobs, reviews: filteredReviews});

    }catch(err){
        return next(err);
    }
}
exports.getUserAcceptedBids = async function(req, res, next){
    try{
        const token = req.headers.authorization.split(" ")[1];
        const uid = await idParse(token);

        const user = await db.User.findById(uid).populate('bids');

        const accepted = user.bids.filter((bid)=>(bid.accepted === true));

        return res.status(200).json(accepted);

    }catch(err){
        return next(err);
    }
}
exports.updateUser = async function(req, res, next){
    try{
        const token = req.headers.authorization.split(" ")[1];
        const user = await idParse(token);
        let items = req.body
        if(typeof items.username === "undefined" && typeof items.email === "undefined"
        && typeof items.created === "undefined" && typeof items.password === "undefined"
        && typeof items.messageSessions === "undefined" && typeof items.inactiveSessions === "undefined"
        && typeof items.jobs === "undefined" && typeof items.bids === "undefined" && typeof items.firstname ==="undefined"
        && typeof items.lastname === "undefined" && typeof items.visibility === "undefined"){
            db.User.findOneAndUpdate({_id: user}, {...items, newNoEdit:false}, {new: true}, async (err,doc)=>{
            if(err) return res.status(400).json({error: "an error occured"});
            const {phone, photo, description, best_front, best_back, primary,username,firstname,lastname, created, email, newNoEdit} = doc;
            let responseObject = {email, phone, photo, description, best_front, best_back, primary,username,firstname,lastname, created, newNoEdit};
             res.status(200).json({...responseObject});
        })
    }else{
        return res.status(400).json({error: "attempt to update unauthorized field"});
    }
    //    return res.status(200).json({message: "update attempt complete"});
    }catch(err){
        return next(err);
    }
}

exports.searchForUser = async function(req, res, next){
    try{
        let {partial} = req.body;

        if(partial.length !== 0){
        const result = await db.User.find({username: new RegExp('^' + partial, 'i')}).limit(3);
            const users = result.map((user)=>{
                const {photo, username, _id} = user;
                return {photo, username, _id};
            });
            return res.status(200).json(users);
        }

        return res.status(200).json({err: "low query"});
    }catch(err){
        return next(err);
    }
}

exports.getUserProfile = async function(req, res, next){
    try{
        const {user_id} = req.body;
        const queryOfUser = await db.User.findById(user_id).populate({path: "jobs", select:"title date active", options: {limit: 10, sort: "-date"}})
        .populate({path: "bids", populate: {path:"job", select: "_id date active"}, options: {limit: 10, sort: "-date"}})
        .populate({path: "reviews", populate: {path:"user_by"}, options: {limit: 10, sort: "-date"}});

        const {phone, photo, description, best_front, best_back, primary,username, email, verified,
            firstname,lastname, created, bids, jobs, reviews, hide} = queryOfUser;

        const returnJobs = jobs.filter((job)=>{ //maybe filter bids this way too.
           return job.active;
        })

        const filteredReviews = reviews.map((r)=>{
             const {user_by, job, review, positive} = r;
             const {username, photo, _id} = user_by;
             return {user: {username, photo, _id}, job, review, positive};

         });

        let returnObject = {phone, photo, description, best_front, best_back, primary,username, verified,
            email, firstname,lastname,created, bids, jobs: returnJobs, reviews: filteredReviews};

        hide[0] === '1' && delete returnObject.lastname;
        hide[1] === '1' && delete returnObject.email;
        // hide[2] === '1' && delete returnObject.phone;

        return res.status(200).json(returnObject);
    }catch(err){
        return next(err);
    }
}

exports.profileView = async function(req, res, next){
    try{
        const uid = await idParse(req.headers.authorization.split(" ")[1]);
        const {boolString} = req.body;
        const user = (boolString.length === 3 && Array.from(boolString).every((b)=>(b==='1'||b==='0'))) &&
            await db.User.findOneAndUpdate({_id: uid}, {hide: boolString}, {new: true});
        //pos 0 is lastname, pos 1 is email, pos 2 is phone

        const {hide} = user;
        return res.status(200).json({hide});
    }catch(err){
        return next(err);
    }
}

exports.uploadProfileImage = async function(req, res, next){
    try{
        if(!req.files){
            return res.status(400).send("No file uploaded")
        }
        let file = req.files.file;
        // const buffer = readChunk.sync(file)
        // console.log(file);
        // console.log(fileType(file.data));
        const {mime} = fileType(file.data);
        const first_mime = mime.split('/')[0];
        if(first_mime === "image"){
        const id = await idParse(req.headers.authorization.split(" ")[1]);
        type = file.name.split(".")[file.name.split(".").length -1]
        db.User.findOneAndUpdate({_id: id}, {photo: type}, {new: true}, (err,doc)=>{
            if(err) return res.status(400).json({error: "an error occured"});
        })
        file.mv(`public/uploads/${id}.${type}`, (err)=>{
            if(err) return res.status(500).json(err)
            return res.status(200).json({photo: `${type}?${(new Date()).getTime()}`});
        });
        }else{
        return res.status(400).json({error: "file is not an image!"})
        }
    }catch(err){
        return next(err)
    }

}
exports.getPostedJobs = async function(req,res,next){
    try{
        const uid = await idParse(req.headers.authorization.split(" ")[1]);
        const ujobs = await db.User.findById(uid).populate("jobs");

        const {jobs} = ujobs;
        const notifJobs = jobs.filter((job)=>{
            return ujobs.notifs_id.indexOf(job._id) !== -1;
        });
        console.log(notifJobs);

        return res.status(200).json(notifJobs);

    }catch(err){
        return next(err);
    }
}
exports.getRecentMessages = async function(req,res,next){
    try{
        const uid = await idParse(req.headers.authorization.split(" ")[1]);
        const user = await db.User.findById(uid).populate( "messageSessions").exec(async (error, result)=>{
            if(result === null) return res.status(400).json({message: "currently no messages"});
            const finalResult = result.messageSessions.map(async(item)=>{
                const mostRecentMessage = await db.Message.findById(item.messages[item.messages.length-1]).populate("user");//probably should use selection here
                const {_id, session, user, text, date} = mostRecentMessage;
                const {firstname, lastname, username, photo} = mostRecentMessage.user;
                const filteredRecentMessage = {_id, session, user: {firstname, lastname, username, photo}, text, date};

                return filteredRecentMessage;
            });

            Promise.all(finalResult).then((value)=>{
                const filteredResult = value.filter((session)=>{
                    console.log("session:::", session);
                    return result.notifs_id.indexOf(session.session) !== -1;
                })
                console.log(filteredResult);
                return res.status(200).json(filteredResult);
            })


        });
    }catch(err){
        return next(err);
    }
}
