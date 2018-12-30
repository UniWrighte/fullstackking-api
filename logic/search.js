const db = require("../models");
const {idParse} = require("../logic/helpers");

exports.userExists = async function(req, res, next){
    try{
        const {username} = req.params;
        const exists = await db.User.findOne({username});
        const real = !!exists;
        return res.status(200).json({real});
    }catch(err){
        return next(err);
    }
}

exports.searchJobs = async function(req,res,next){
    try{
        let {search} = req.body;
        if(search.length > 1){
            // const jobResult = await db.Job.find({title: new RegExp('^' + search, 'i')}).limit(3) ;
            const [jobResult, backJobResult, frontJobResult] = await Promise.all(
            [db.Job.find({title: {"$regex": search, "$options": "i"}}).limit(3),
             db.Job.find({back_end: {"$regex": search, "$options": "i"}}).limit(3),
             db.Job.find({front_end: {"$regex": search, "$options": "i"}}).limit(3)
            ]);

            let searchResult = jobResult.length > 0 ? [...jobResult] : [];
                searchResult = backJobResult.length > 0 ? [...searchResult, ...backJobResult] : searchResult;
                searchResult = frontJobResult.length > 0 ? [...searchResult, ...frontJobResult] : searchResult;

                return res.status(200).json({searchResult});

        }else{
            return res.status(400).json({error: "search string not long enough."});
        }
    }catch(err){
        return next(err);
    }
}

exports.generalSearch = async function(req, res, next){
    try{
        let {partial} = req.body;
        if(partial !== 0){
            const [usernameResult, jobResult, backJobResult,frontJobResult, backUserResult, frontUserResult] =
            await Promise.all(
            [db.User.find({username: {"$regex": partial, "$options": "i"}}).limit(3),
             db.User.find({title: {"$regex": partial, "$options": "i"}}).limit(3),
             db.Job.find({back_end: {"$regex": partial, "$options": "i"}}).limit(3),
             db.Job.find({front_end: {"$regex": partial, "$options": "i"}}).limit(3),
             db.User.find({best_back: {"$regex": partial, "$options": "i"}}).limit(3),
             db.User.find({best_front: {"$regex": partial, "$options": "i"}}).limit(3)
            ]);

            //I should probably save this in another collection and query that first.
            //I don't know what that comment means, BUT, I could do something promise based
            //for each one that processes a stream, returns a promise and the above structure
            //does something like the await Promise.all above but for a stream that includes the
            //mappings too.
            const usernameList = usernameResult.map((user)=>{
                const {username, best_front, best_back, _id} = user;
                return {username, best_front, best_back, _id};
            });
            const jobTitleList = jobResult.map((job)=>{
                const {title, front_end, back_end, _id} = job;
                return {title, front_end, back_end, _id};
            });

            const backJobList = backJobResult.map((job)=>{
                const {title, front_end, back_end, _id} = job; //might move these to seperate function
                return {title, front_end, back_end, _id};
            });
            const frontJobList = frontJobResult.map((job)=>{
                const {title, front_end, back_end, _id} = job;
                return {title, front_end, back_end, _id};
            });
            const backUserList = backUserResult.map((user)=>{
                const {username, best_front, best_back, _id} = user;
                return {username, best_front, best_back, _id};
            });
            const frontUserList = frontUserResult.map((user)=>{
                const {username, best_front, best_back, _id} = user;
                return {username, best_front, best_back, _id};
            })


            let searchResult = usernameList.length > 0 ? {usernameList} : {};
                searchResult = jobTitleList.length > 0 ? {...searchResult, jobTitleList} : searchResult;
                searchResult = backJobList.length > 0 ? {...searchResult, backJobList} : searchResult;
                searchResult = frontJobList.length > 0 ? {...searchResult, frontJobList} : searchResult;
                searchResult = backUserList.length > 0 ? {...searchResult, backUserList} : searchResult;
                searchResult = frontUserList.length > 0 ? {...searchResult, frontUserList} : searchResult;



            return res.status(200).json({searchResult});
        }
    }catch(err){
        return next(err);
    }
}

exports.activeUserJobs = async function(req,res,next){
   try{
    // const uid = await idParse(req.headers.authorization.split(" ")[1]);
    const uid = req.baseUrl.split("/")[2];
    const user = await db.User.findById(uid).populate("jobs").populate({path: "bids", populate: {path: "job"}});
    const {jobs, bids} = user;
    const active_bids_only = bids.filter((bid)=>(bid.accepted === true && bid.job.active === true));
    const active_bids = active_bids_only.map((bid)=>(bid.job));
    const bid_jobs = bids.map((bid)=>(bid.job));

    return res.status(200).json({bids: bid_jobs, jobs, active_bids});
   }catch(err){
       return next(err)
   }
}
