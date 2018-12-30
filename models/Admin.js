const db = require("mongoose");
const bcrypt = require("bcrypt");

const AdminSchema = new db.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    pin: {
        type: String,
        required: true
    },
    systemWidePassword: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    last_log: {
        type: Date,
        default: Date.now
    },
    last_fail: {
        type: Date
    },
    num_fails: {
        type: Number,
        default: 0
    }
});
//I might want to add arrays for objects that can be manipulated here for accountability.


AdminSchema.pre("save", async function(next){
    try {
        if(!this.isModified("password") && !this.isModified("pin")){
            return next();
        }
        if(this.isModified("password")){
            this.password = await bcrypt.hash(this.password, 10);
        }
        if(this.isModified("pin")){
            this.pin = await bcrypt.hash(this.pin, 10);
        }
        return next()
    }catch(err){
        return next(err);
    }
})
AdminSchema.methods.checkPassPin = async function(attemptPin, attemptPass, next){
    const [pinMatch, passMatch] =
     await Promise.all([
            bcrypt.compare(attemptPin, this.pin),
            bcrypt.compare(attemptPass, this.password)
        ]);
    if(pinMatch && passMatch && this.num_fails < 4){
        this.last_log = Date.now();
        this.num_fails = 0;
    }else{
        this.last_fail = Date.now();
        this.num_fails = this.num_fails + 1;
    }
    return pinMatch && passMatch && this.num_fails < 4;
}

const Admin = db.model('Admin', AdminSchema);

module.exports = Admin;
