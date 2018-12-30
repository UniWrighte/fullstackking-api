const db = require("mongoose");


const SupportS = new db.Schema({
    description:{
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    select: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    email: {
        type: String,
        required: true
    },
    open: {
        type: Boolean,
        default: true
    }
})

const Support = db.model("Support", SupportS);

module.exports = Support;
