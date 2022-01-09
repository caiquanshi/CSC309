'use strict';
const express = require('express');
const app = express();
const port = process.env.PORT || 3001 
const { mongoose } = require('./db/mongoose')
const { User } = require('./models/user')
const { Post } = require('./models/post')
const { ObjectID } = require('mongodb')
// body-parser: middleware for parsing HTTP JSON body into a usable object
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const log = console.log
// express-session for managing user sessions
const session = require('express-session')
app.use(bodyParser.urlencoded({ extended: true }));

/*** Session handling **************************************/
// Create a session cookie
app.use(
    session({
        secret: "oursecret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 60000,
            httpOnly: true
        }
    })
);

// A route to login and create a session
app.post("/users/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    log(email, password);
    // Use the static method on the User model to find a user
    // by their email and password
    User.findByEmailPassword(email, password)
        .then(user => {
            // Add the user's id to the session cookie.
            // We can check later if this exists to ensure we are logged in.
            req.session.user = user._id;
            req.session.email = user.email;
            res.send({ currentUser: user.email, currentUser_id: user._id });
        })
        .catch(error => {
            res.status(400).send()
        });
});

// A route to logout a user
app.get("/users/logout", (req, res) => {
    // Remove the session
    req.session.destroy(error => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send()
        }
    });
});

// A route to check if a use is logged in on the session cookie
app.get("/users/check-session", (req, res) => {
    if (req.session.user) {
        res.send({ currentUser: req.session.email, currentUser_id:req.session.user });
    } else {
        res.status(401).send();
    }
});


/*** API Routes ************************************/

/** Recipe routes below **/
app.get('/Recipe/:id', (req, res, next) => {
    // Load a recipe
    const id = req.params.id
    if (!ObjectID.isValid(id)) {
		res.status(404).send()
    }
    else {
        Post.findById(id).then(data => {
            res.send(data);
        }).catch(err => {
            res.status(500).send(err);
        })
    }
});

app.get('/Recipe/:tag', (req, res) => {
    // Load recipes by category tag
    const category = req.params.tag
    if (!ObjectID.isValid(category)) {
		res.status(404).send()
    }
    else {
        Post.find().then(data => {
            const recipe_list = []
            data.array.forEach(recipe => {
                if (recipe.categoryList.includes(category)){
                    recipe_list.push(recipe)
                }
            });
            res.send({recipe_list});
        }).catch(err => {
            res.status(500).send(err);
        })
    }
});

app.post('/Recipe', (req, res) => {
    // Create a new recipe
    const recipe = new Post({
        title: req.body.title,
        creator: req.body.creator,
        description: req.body.description,
        categories: req.body.categories,
        ingredients: req.body.ingredients,
        steps: req.body.steps
    });
    recipe.save().then(
        (result) => {
            res.send(result);
        },
        (error) => {
            res.status(400).send(error); // 400 for bad request
        }
    );
});

app.delete('/Recipe/:id', (req, res) => {
    // can be accessed by either admin or user
	const id = req.params.id
    if (!ObjectID.isValid(id)) {
        res.status(404).send()
    }
    // delete a recipe by its id
    Post.findByIdAndRemove(id).then((post) => {
        if (!post) {
            res.status(404).send()
        } else {
            res.send(post)
        }
    }).catch((error) => {
        res.status(500).send()
    })
})

/** User routes below **/
// Set up a POST route to *create* a user of your web app (*not* a student).
app.post('/users', (req, res) => {
	console.log(req.body)

	// Create a new user
	const user = new User({
		email: req.body.email,
        password: req.body.password,
        isAdmin: false,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        dateCreated: new Date(),
        posts: [], // List of post Ids 
        favorites: [],
        followers: [], // List of user Ids
        following: []  // List of user Ids
	})

	// Save the user
	user.save().then((user) => {
		res.send(user)
	}, (error) => {
		res.status(400).send(error) // 400 for bad request
	})
})



app.get("/Recipe_for_user/:id", (req, res) => {
    const id = req.params.id
})



app.delete('/Profile/:id', (req, res) => {
    const id = req.params.id
    if (!ObjectID.isValid(id)) {
        res.status(404).send()
    }
    //delete a user by its id
    User.findByIdAndRemove(id).then((user) => {
        if (!user) {
            res.status(404).send()
        } else {
            res.send(user)
        }
    }).catch((error) => {
        res.status(500).send()
    })

})

// app.patch('/Recipe/:id/:comment_id', (req, res) => {
//     // delete a comment on a post (user or admin)

// })


/*** Webpage routes below **********************************/
// Serve the build
app.use(express.static(__dirname + "/client/build"));

// All routes other than above will go to index.html
app.get("*", (req, res) => {
    res.sendFile(__dirname + "/client/build/index.html");
});

app.listen(port, () => {
	console.log(`Listening on port ${port}...`)
}) 

module.exports = {app};