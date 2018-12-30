const db = require("mongoose");
const User = require("./User");
const Job = require("./Job");

const paymentSchema = new db.Schema({
    amount:{ //I need to add these up for both types of users. payouts will still be manual for a while though. 
        type: Number,
        required: true
    },
    user:{
        type: db.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    job:{
        type: db.Schema.Types.ObjectId,
        ref: "Job",
        required: true
    },
    charge_id:{
        type: String,
        required: true
    },
    complete:{
        type: Boolean,
        required: true,
        default: false
    }, 
    payout_complete:{
        type: Boolean,
        required: true,
        default: false
    },
    date:{
        type: Date,
        default: Date.now
    }
});
paymentSchema.pre("save", async function(next){
    try{
        let user = await User.findById(this.user);
        if(user.payments.indexOf(this.id) === -1){
            user.payments.push(this.id);
	    await user.save();
	    
        }
        let job = await Job.findOneAndUpdate({_id: this.job}, {verified: true});


        return next();
    }catch(err){
        return next(err);
    }
})

const Payment = db.model("Payment", paymentSchema);

module.exports = Payment;
