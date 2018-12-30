const db = require("mongoose");
const bcrypt = require("bcrypt");

let UserS = new db.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    primary:{
        type: Boolean, //0 for freelancer and 1 for job poster.
        default: 0
    },
    phone: {
        type: String,
        default: "phone not set"
    },
    photo: {  //a url for a seperately uploaded file to a different part of the file structure in the server.
        type: String,
        default: "no photo uploaded"
    },
    description: {
        type: String,
        default: "no description set"
    },
    best_front: {
        type: String,
        default: "no front set"
    },
    best_back: {
        type: String,
        default: "no back set"
    }, //front and backend have to be visible along with description adn username.
    hide:{ //change to array.
        type: String,
        default: "111"
    },
    created:{
        type: Date,
        default: Date.now
    },
    messageCounter:{
        type: Number,
        default: 0
    },
    total_amount:{
	    type: Number,
	    default: 0
    },
    payment_request:{
        type: Boolean,
        default: false
    },
    newNoEdit:{
        type: Boolean,
        default: true
    },
    resetPass:{
        type: Boolean,
        default: false
    },
    resetReqTime:{
        type: Date
    },
    resetPassHash:{
        type: String
    },
    verified: {
        type: Boolean,
        default: false
    },
    activateStr: {
        type: String
    },
    block: {
        type: Boolean,
        default: false
    },
    messageSessions: [{
        type: db.Schema.Types.ObjectId,
        ref: "MessageSession"
    }],
    inactiveSessions: [{
        type: db.Schema.Types.ObjectId,
        ref: "MessageSession"
    }],
    jobs: [{
        type: db.Schema.Types.ObjectId,
        ref: "Job"
    }],
    accepted_jobs:[{
        type: db.Schema.Types.ObjectId,
        ref: "Job"
    }],
    bids: [{
        type: db.Schema.Types.ObjectId,
        ref: "Bid"
    }],
    payments: [{
        type: db.Schema.Types.ObjectId,
        ref: "Payment"
    }],
    reviews: [{
        type: db.Schema.Types.ObjectId,
        ref: "Review"
    }],
    notifs_type:[{
        type: String
    }],
    notifs_id:[{
        type: db.Schema.Types.ObjectId
    }]


});

UserS.pre("save", async function(next){
    try {

        if(!this.isModified("password")){
            return next();
        }
        //add salt?
        const hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
        return next();
    }catch(err){
    return next(err)
    };
})


UserS.methods.checkPass = async function(userInput, next){
    try{
        let passwordIsMatch = bcrypt.compare(userInput, this.password);
        return passwordIsMatch;
    }
    catch(err){
        return next(err);
    }

};
UserS.methods.deactiveMessageSession = async function(session_id, next){
    try{
        this.inactiveSessions.push(session_id);

        const messageSessions = this.messageSessions.filter((item)=>(session_id !== item._id));
        this.messageSessions = messageSessions;
    return next();
    }catch(err){
        return next(err);
    }
}


const User = db.model('User', UserS);

module.exports = User;
