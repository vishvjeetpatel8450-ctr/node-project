const mongoos = require("mongoose");

const userschema = new mongoos.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    aadharnumber: {   
        type: String,
        required: true,
        unique: true
    },
    age: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    password: {
        type: String
    },
    graduation: {
        type: String,
    },
    refreshToken: {
    type: String,
    },
    photo: {
    type: String,
    }
}, {
     timestamps: true
});
 
module.exports = mongoos.model("user",userschema);