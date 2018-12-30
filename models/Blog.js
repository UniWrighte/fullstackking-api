const db = require("mongoose");

const BlogSchema = new db.Schema({
    title: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    content: [{
        type: String
    }],
    author_name:{
        type: String,
        required: true
    },
    show:{
        type: Boolean,
        default: true
    },
    admin_poster: {
        type: db.Schema.Types.ObjectId,
        required: true
    }

});

BlogSchema.pre("save", async function(next){
    try{
        if(this.content.length > 0){
            return next();
        }
        return "Error: content not defined"; //if this doesn't work I will  neeed to throw an error. with thow;
    }catch(err){
        return next(err);
    }

});

const Blog = db.model('Blog', BlogSchema);

module.exports = Blog;
