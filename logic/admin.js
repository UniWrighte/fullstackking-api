const db = require("../models")

exports.test = async function(req, res, next){
    try{
        return res.status(200).json({message: "here is a message"});
    }catch(err){
        return next(err);
    }
}

exports.getBlog = async function(req, res, next){
    try{
        const blogs = await db.Blog.find({});
        return res.status(200).json({blogs});
    }catch(err){
        return next(err);
    }
}

exports.postToBlog = async function(req, res, next){
    try{
        const {title, content, author_name} = req.body;
        const admin_poster = req.baseUrl.split("/")[2];
        await db.Blog.create({
            title,
            content,
            author_name,
            admin_poster
        });
        return res.status(200).json({message: "blog post success"});
    }catch(err){
        return next(err);
    }
}

exports.collections = async function(){
    try{
        return Object.keys(db).map((key)=>({[key]: db[key]}));
    }catch(err){
        return next(err);
    }
}

exports.collectionNames = async function(req, res, next){
    try{
        return res.status(200).json({names: Object.keys(db)});
    }catch(err){
        return next(err)
    }
}

exports.unblockUser = async function(req, res, next){
    try{
        const {uid} = req.body;
        const user = await db.User.findById(uid);
        user.block = false;
        await user.save();
        return res.status(200).json({message: "success"});
    }catch(err){
        return next(err);
    }
}
exports.blockUser = async function(req, res, next){
    try{
        const {uid} = req.body;
        const user = await db.User.findById(uid);
        user.block = true;
        await user.save();
        return res.status(200).json({message: "success"});
    }catch(err){
        return next(err);
    }
}

exports.lookupUser = async function(req, res, next){
    try{
        //lookup a user with query parameters
        const {param, value} = req.query;
        console.log(req.query);
        const user = await db.User.find({[param] : {"$regex" : value, "$options": "i"}}).select("-password");

        return res.status(200).json({user});
    }catch(err){
        return next(err);
    }
}

exports.closeSupportTicket = async function(req, res, next){
    try{
        const {id} = req.params;
        db.Support.update({_id: id}, {open: false}, {new: true}, (err, doc)=>{
            if(err) return next(err);
            return res.status(200).json({message: "success"});
        });
    }catch(err){
        return next(err);
    }
}

exports.getSupportTickets = async function(req, res, next){
    try{
        const {num, startDate, closed} = req.query;
        const date = !!startDate ? startDate : Date.now();
        const open = !!closed && closed === "true" ? false : true; //I might be able to make this simpler
        const tickets = await db.Support.find({open, date: {$lte: date}})
                                        .limit(Number(num) + 1)
                                        .sort("-date");

        return res.status(200).json({tickets});
    }catch(err){
        return next(err);
    }

}

exports.searchJobsAdmin = async function(req, res, next){
    try{
        const {field, param, lose} = req.body;
        const jobs = lose === "true" ? await db.Job.find({[field] : {"$regex": param, "$options":"i"}}) :
            await db.Job.find({[field] : param});
        return res.status(200).json({jobs});
    }catch(err){
        return next(err);
    }
}

exports.findJobById = async function(req, res, next){
    try{
        const {id} = req.params;
        const job = await db.Job.findById(id);
        return res.status(200).json({job});
    }catch(err){
        return next(err);
    }
}

exports.recentJobs = async function(req,res,next){
    try{
        const {num} = req.params;
        const jobs = await db.Job.find({active: true}).limit(Number(num)).sort('-date');
        return res.status(200).json({jobs});
    }catch(err){
        return next(err);
    }
}

exports.getPayouts = async function(req,res,next){
    try{
        const {num, active, startDate} = req.query;
        const completed = active !== "false";
        const date = !!startDate ? startDate : Date.now();
        const payouts = await db.Payout.find({completed, date: {$lte: date}})
                                       .limit(Number(num) + 1).sort("-date");
        return res.status(200).json({payouts});
    }catch(err){
        next(err);
    }
}

exports.closePayout = async function(req, res, next){
    try{
        const {id} = req.params;
        db.Payout.update({_id: id}, {completed: true}, {new: true}, (err, doc)=>{
            if(err) return next(err);
            return res.status(200).json({message: "success"});
        });
    }catch(err){
        next(err);
    }
}
