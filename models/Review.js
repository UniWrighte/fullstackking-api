const db = require("mongoose");
const User = require("./User");
const Job = require("./Job");

let ReviewS = new db.Schema({
    review: {
        type: String
    },
    positive:{
        type: Boolean,
        required: true
    },
    user_by:{
        type: db.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    user_to:{
        type: db.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    job: {
        type: db.Schema.Types.ObjectId,
        ref: "Job",
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    }
})


ReviewS.pre("save", async function(next){
    try{
        console.log("fucking sutpds=ad-=fasd fiajd")
        const user = await User.findById(this.user_to);
        if(user.reviews.indexOf(this.id) === -1){
            user.reviews.push(this.id);
            await user.save();
        }


        return next();
    }catch(err){
        return next(err);
    }
})

let Review = db.model("Review", ReviewS);

module.exports = Review;
