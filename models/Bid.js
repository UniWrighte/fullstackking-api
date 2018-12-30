const db = require("mongoose");
const Job = require("./Job");
const User = require("./User");



const bidSchema = new db.Schema({
    user: {
        type: db.Schema.Types.ObjectId,
        ref: "User"
    },
    job: {
        type: db.Schema.Types.ObjectId,
        ref: "Job"
    },
    title: {
        type: String,
        required: true
    },
    front:{
         type: String,
         required: true
     },
    back:{
         type: String,
         required: true
     },
    details: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    accepted: {
        type: Boolean,
        required: true,
        default: 0
    },
    date:{
        type: Date,
        default: Date.now
    },
    active:{
        type: Boolean,
        default: true
    },
    date_inactive:{
        type: Date
    }

});


bidSchema.pre("save", async function(next){
    try{
        //add the id of this item to the user's list of bids and the job's list of bids.
        let user = await User.findById(this.user);
        let job_obj = await Job.findById(this.job).populate('user');
        if(user.bids.indexOf(this.id) === -1) {

        user.bids.push(this.id)
        //job objwa jobawa obj... job aba jobawa
        job_obj.user.notifs_id.push(this.job);
        job_obj.user.notifs_type.push("bid");

        await job_obj.user.save();
    }

        let job = await Job.findById(this.job); if(job.bids.indexOf(this.id) ===-1)
        job.bids.push(this.id);

        if(this.isModified('accepted')){
        console.log(this.accepted, "here is accepted <<<");
        }



        await job.save();
        await user.save();
        return next();
    }catch(err){
        return next(err);
    }
})



let Bid = db.model("Bid", bidSchema);

module.exports = Bid;
