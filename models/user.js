/* User mongoose model */
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const { ObjectID } = require('mongodb')

const userSchema = new mongoose.Schema({
	email: {
		//the unique thing for login
		type: String,
		required: true,
		minlegth: 1,
		trim: true,
		unique: true,
		validate: {
			validator: validator.isEmail,
			message: 'Not valid email'
		}
	},
	profileImg: {
		type: String
	},
	password: {
		type: String,
		required: true,
		minlegth: 8
	},
	isAdmin: {
		type: Boolean,
		require: true
	},
	isReported: {
		type: Boolean,
		require: true
	},
	firstName: {
		type: String,
		required: true,
		minlegth: 1,
		trim: true
	},
	lastName: {
		type: String,
		required: true,
		minlegth: 1,
		trim: true
	},
	username: {
		//the username to display don't have to be unique
		type: String,
		required: true,
		minlegth: 8,
		trim: true
	},
	bio: {
		type: String,
		maxlength: 1000			
	}, dateCreated: {
		type: Date
	},
	posts: [{ type : String, ref: 'Post' }], // List of post Ids 
	favorites: [{ type : String, ref: 'Post' }],
	followers: [{ type : String, ref: 'User' }], // List of user Ids
	following: [{ type : String, ref: 'User' }]  // List of user Ids
	
})

userSchema.pre('save', function(next) {
	const user = this; // binds this to User document instance

	// checks to ensure we don't hash password more than once
	if (user.isModified('password')) {
		// generate salt and hash the password
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user.password, salt, (err, hash) => {
				user.password = hash
				next()
			})
		})
	} else {
		next()
	}
})

// A static method on the document model.
// Allows us to find a User document by comparing the hashed password
//  to a given one, for example when logging in.
userSchema.statics.findByEmailPassword = function(email, password) {
	const User = this // binds this to the User model

	// First find the user by their email
	return User.findOne({ email: email }).then((user) => {
		if (!user) {
			return Promise.reject()  // a rejected promise
		}
		// if the user exists, make sure their password is correct
		return new Promise((resolve, reject) => {
			bcrypt.compare(password, user.password, (err, result) => {
				if (result) {
					resolve(user)
				} else {
					reject()
				}
			})
		})
	})
}

userSchema.statics.findReported = function() {
	const user = this
	return user.find({isReported: true}).then((user)=>{
		return new Promise((resolve, reject)=>{
			if (!user){
				reject()
			} else{
				resolve(user)
			}
		})
	})
}


const User = mongoose.model('User', userSchema);
module.exports = { User }