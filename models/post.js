const mongoose = require('mongoose')

const postSchema = new mongoose.Schema( {

	title: {

		type: String,
		required: true,
		minlegth: 1,
		trim: true
	},
	creator: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	categories: {
		type: [String]
	},
	ingredients: {
		type: [String]
	},
	steps: {
		type: [String]
	},
	likes: {
		type: Number
	},
	cookTime: {
		type: Number
	},
	isReported: {
		type: Boolean
	},
	comments: {
		type: [String]
	},
	img: {
		type: String
	}
})

postSchema.statics.searchTitle = function(keyword) {
	const Post = this // binds this to the Post model

	return Post.find({ title: new RegExp(keyword, 'i') }).then((post) => {
		return new Promise((resolve, reject) => {
			if (!post) {
				reject()
			} else {
				resolve(post)
			}
		})
	})
}

postSchema.statics.findReported = function() {
	const post = this
	return post.find({isReported: true}).then((post)=>{
		return new Promise((resolve, reject)=>{
			if (!post){
				reject()
			} else{
				resolve(post)
			}
		})
	})
}

const Post = mongoose.model('Post', postSchema);
module.exports = { Post }


