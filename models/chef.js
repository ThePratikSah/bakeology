const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const chefSchema = new Schema({
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    status:{
        type: String,
        default: 'I am new!'
    },
    profileImageUrl:{
        type: String,
        required: true
    },
    recipes:[{ 
        type: Schema.Types.ObjectId,
        ref: 'Recipe'
    }],
});