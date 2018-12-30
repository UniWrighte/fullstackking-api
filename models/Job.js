const db = require("mongoose");
const User = require("./User");
const JobArchive = require("./JobArchive");

let jobSchema = new db.Schema({
    user: {
        type: db.Schema.Types.ObjectId,
        ref: "User"
    },
    title:{
        type: String,
        required: true
    },
    front_end:{
        type: String //will have a posibility of choices for prefferred or required front end architecture.
    },
    back_end:{
        type: String //perferred or required backend architecture.
    },
    configuration_required:{
        type: Boolean, //specifies if the task requires the listed architecture type(s).
        default: false
    },
    description:{
        type: String,
        required: true
    },
    amount:{
        type: Number,
        required: true,
        default: 0
    },
    contract:{
        type: String,
        required: true,
        default: "entire project"
    },
    verified:{
        type: Boolean,
        default: 0
    },
    accepted_bid:{
        type: db.Schema.Types.ObjectId,
        ref: "Bid"
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
    },
    completed:{
        type: Boolean,
        default: false
    },
    review_id:{
        type: db.Schema.Types.ObjectId,
        ref: "Review"
    },
    bids: [{
        type: db.Schema.Types.ObjectId,
        ref: "Bid"
    }]
})

jobSchema.pre("save", async function(next){
    try{

        let user = await User.findById(this.user)
        if(user.jobs.indexOf(this.id) === -1) user.jobs.push(this.id);
        await user.save();

        return next();
    }catch(err){
        return next(err);
    }
});




const Job = db.model("Job", jobSchema);

module.exports = Job;
