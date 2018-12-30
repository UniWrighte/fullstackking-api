const db = require('mongoose');

const PayoutS = new db.Schema({
    type:{
        type: String,
        required: true
    },
    account:{
        type: String,
        required: true
    },
    routing:{
        type: Number
    },
    completed:{
        type: Boolean,
        default: false
    },
    user:{
        type: db.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    }
})

const Payout = db.model("Payout", PayoutS);

module.exports = Payout;
