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
            expires: 600000,
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


app.get("/user/:id", (req, res) => {
    const userId = req.params.id

    if (!ObjectID.isValid(userId)) {
        res.status(404).send()
    }
    User.findById(userId).then(user => {
        res.send(user)
    }).catch(err => {
        res.status(500).send(err)
    })
})

// app.get("/all_users", (req, res) => {
//     User.find().then(user => {
//         res.send(user)
//     }).catch(err => {
//         res.status(500).send(err)
//     })
// })

// A route to logout a user
app.get("/users/logout", (req, res) => {
    // Remove the session
    req.session.destroy(error => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send()
        }
    })
});

// A route to check if a use is logged in on the session cookie
app.get("/users/check-session", (req, res) => {
    if (req.session.user) {
        res.send({ currentUser: req.session.email, currentUser_id: req.session.user });
    } else {
        res.status(401).send();
    }
});


/*** API Routes ************************************/

/** Recipe routes below **/
// Load a recipe
app.get('/Post/:id', (req, res) => {
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

// Load recipes by category tag
app.get('/Post/Category/:tag', (req, res) => {
    const category = req.params.tag
    const query = {}
    query["categories"] = category
    Post.find(query).then(data => {
        res.send(data);
    }).catch(err => {
        res.status(500).send(err);
    })

});

app.get('/Search_recipe/:searchKey', (req, res) => {
    const keyword = req.params.searchKey
    log(keyword)
    if (!keyword) {
        res.status(400).send()
    } else {
        Post.searchTitle(keyword).then(post => {
            res.send(post);
        }).catch(err => {
            res.status(500).send(err);
        })
    }
})
/* Query recipe by creator */
app.get('/Post/user/:userId', (req, res) => {
    const userId = req.params.userId
    if (!ObjectID.isValid(userId)) {
        res.status(404).send()
    } else {
        const query = {}
        query["creator"] = userId
        Post.find(query).then(data => {
            res.send(data);
        }).catch(err => {
            res.status(500).send(err);
        })
    }
});

app.post('/Post', (req, res) => {
    // Create a new recipe
    const recipe = new Post({
        title: req.body.title,
        creator: req.body.creator,
        description: req.body.description,
        categories: req.body.categories,
        ingredients: req.body.ingredients,
        steps: req.body.steps,
        likes: 0,
        cookTime: req.body.cookTime,
        isReported: false,
        comments: [],
        img: req.body.img
    });

    recipe.save().then(
        (result) => {
            console.log(result);
            res.send(result);
        },
        (error) => {
            res.status(400).send(error); // 400 for bad request
        }
    );
});

app.delete('/Post/:id', (req, res) => {
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
        res.status(500).send(error)
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
        isReported: false,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        dateCreated: new Date(),
        bio: req.body.bio,
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

app.delete('/Users/:id', (req, res) => {
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
        res.status(500).send(error)
    })

})

app.patch('/user/follow/:id/:otherId', (req, res) => {
    // follow a user
    const id = req.params.id;
    const otherId = req.params.otherId;

    if (!ObjectID.isValid(id) || !ObjectID.isValid(otherId)) {
        res.status(404).send()
    }

    User.findById(id).then((user) => {
        user.following.push(otherId)
        user.save()
    }).catch((error) => {
        console.log(error)
        res.status(400).send(error);
    });

    User.findById(otherId).then((user) => {
        user.followers.push(id)
        user.save()
        res.send()
    }).catch((error) => {
        console.log(error)
        res.status(400).send(error);
    });
});

app.patch('/user/unfollow/:id/:otherId', (req, res) => {
    // unfollow a user
    const id = req.params.id;
    const otherId = req.params.otherId;
    if (!ObjectID.isValid(id) || !ObjectID.isValid(otherId)) {
        res.status(404).send()
    }
    User.findById(id).then((user) => {
        user.following.pull(otherId)
        user.save()
    }).catch((error) => {
        console.log(error)
        res.status(400).send(error);
    });

    User.findById(otherId).then((user) => {
        user.followers.pull(id)
        user.save()
        res.send()
    }).catch((error) => {
        console.log(error)
        res.status(400).send(error);
    });
});

app.patch('/favorite/:user_id/:recipe_id', (req, res) => {
    // favorite a recipe
    const user_id = req.params.user_id
    const recipe_id = req.params.recipe_id
    if (!ObjectID.isValid(user_id) || !ObjectID.isValid(recipe_id)) {
        res.status(404).send()
    }
    User.findById(user_id).then((user) => {
        user.favorites.push(recipe_id)
        user.save()
    }).catch((error) => {
        console.log(error)
        res.status(400).send(error);
    });

    Post.findById(recipe_id).then((recipe) => {
        recipe.likes = recipe.likes + 1
        recipe.save()
        res.send()
    }).catch((error) => {
        console.log(error)
        res.status(400).send(error);
    });
});

app.patch('/Post/:id', (req, res) => {//works
    //report a recipe
    const id = req.params.id;
    console.log("reached api")
    Post.findById(id).then((recipe) => {
        if (!recipe) {
            res.status(404).send();
        } else {
            recipe.isReported = req.body.isReported
            recipe.save().then((r) => {
                res.send({
                    "recipe": r
                })
            })

        }
    }).catch((error) => {
        console.log(error)
        res.status(400).send(error);
    });
})

app.patch('/Profile/:id', (req, res) => {
    const id = req.params.id;
    User.findById(id).then((user) => {
        if (!user) {
            res.status(404).send();
        } else {
            user.isReported = req.body.isReported
            user.save().then((u) => {
                res.send({
                    "user": u
                })
            })
        }
    }).catch((error) => {
        res.status(400).send(error)
    })
})

app.get('/reported', (req, res)=>{
    Post.findReported().then((post) => {
        if (!post){
            res.status(404).send()
        }else{
            res.send(post)
        }
    })
})

app.get('/reportedUser', (req, res)=>{
    Post.findReported().then((user) => {
        if (!user){
            res.status(404).send()
        }else{
            res.send(user)
        }
    })
})
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

module.exports = { app };