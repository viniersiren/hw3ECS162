const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const canvas = require('canvas');
const http = require('http');
//i added:
const fs = require('fs');
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const app = express();
const PORT = 8000;

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Handlebars Helpers

    Handlebars helpers are custom functions that can be used within the templates 
    to perform specific tasks. They enhance the functionality of templates and 
    help simplify data manipulation directly within the view files.

    In this project, two helpers are provided:
    
    1. toLowerCase:
       - Converts a given string to lowercase.
       - Usage example: {{toLowerCase 'SAMPLE STRING'}} -> 'sample string'

    2. ifCond:
       - Compares two values for equality and returns a block of content based on 
         the comparison result.
       - Usage example: 
            {{#ifCond value1 value2}}
                <!-- Content if value1 equals value2 -->
            {{else}}
                <!-- Content if value1 does not equal value2 -->
            {{/ifCond}}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

// Set up Handlebars view engine with custom helpers
//
app.engine(
    'handlebars',
    expressHandlebars.engine({
        helpers: {
            toLowerCase: function (str) {
                return str.toLowerCase();
            },

            ifCond: function (v1, v2, options) {
                if (v1 === v2) {
                    return options.fn(this);
                }
                return options.inverse(this);
            },
            isEven: function(num) {
                return num % 2 === 0;
            },
            findUserByUsername: function(username) {
                return users.find(user => user.username === username);
            },
            firstCharacter: function(str) {
                return str[0];
            },
        },
    })
);

app.set('view engine', 'handlebars');
app.set('views', './views');

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Middleware
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.use(
    session({
        secret: 'wo^Jiao',     // Secret key to sign the session ID cookie
        resave: false,                      // Don't save session if unmodified
        saveUninitialized: false,           // Don't create session until something stored
        cookie: { secure: false },          // True if using https. Set to false for development without https
    })
);

// Replace any of these variables below with constants for your application. These variables
// should be used in your template files. 
// 
app.use((req, res, next) => {
    res.locals.appName = 'MyDeveloper';
    res.locals.copyrightYear = 2024;
    res.locals.postNeoType = 'Post';
    res.locals.loggedIn = req.session.loggedIn || false;
    res.locals.userId = req.session.userId || '';
    //res.locals.user = getCurrentUser(req) || {};
    next();
});

app.use(express.static('public'));                  // Serve static files
app.use(express.urlencoded({ extended: true }));    // Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json());                            // Parse JSON bodies (as sent by API clients)

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Routes
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Home route: render home view with posts and user
// We pass the posts and user variables into the home
// template
//
const emojis = [];
app.get('/', (req, res) => {
    const posts = getPosts();
    //console.log(posts);
    //const users = getUsers();
    const user = getCurrentUser(req) || {};
    //render changed from user to users
    res.render('home', { user, posts, emojis }); //used to have users
});

// Register GET route is used for error response from registration
//
app.get('/register', (req, res) => {
    res.render('loginRegister', { regError: req.query.error });
});

// Login route GET route is used for error response from login
//
app.get('/login', (req, res) => {
    res.render('loginRegister', { loginError: req.query.error });
});

// Error route: render error page
//
app.get('/error', (req, res) => {
    res.render('error');
});

// Additional routes that you must implement

app.post('/posts', (req, res) => {
    //req.query.title
    const user1 = findUserById(req.session.userId);

    //req.body.content
    //req.session.title
    addPost(req.body.title, req.body.content, user1)
    res.redirect('/');
});
app.post('/like/:id', (req, res) => {
    const liked = updatePostLikes(req,res);
    if (liked) {
        res.redirect('/'); //to home page
    } else {
        res.status(404).send('Post not found'); // Return 404 if post was not found
    }
});
app.get('/profile', isAuthenticated, (req, res) => {
    // TODO: Render profile page
    userPosts = renderProfile(req, res);
    res.render('profile', {userPosts}); 

});
app.get('/avatar/:username', (req, res) => {
    //call handleAvatar??
    const usernameLetter = req.params.username[0];
    const avatarPath = `public/css/avatars/{usernameLetter}.png`; //dot is current dir
    res.sendFile(path.resolve(avatarPath));
});
app.post('/register', (req, res) => {
    registerUser(req, res);
});


app.post('/emojis', (req, res) => {
    // TODO: fetch emojis
    //https://emoji-api.com/
   /* const options = { // 
        hostname: 'emoji-api.com',
        path: '/emojis',
        method: 'GET'
    };
    const request = http.request(options, response => { //
        let data = '';
        //add each chunk
        response.on('data', chunk => {
            data += chunk;
        });
        //end of response
        response.on('end', () => {
            try {
                const emojis = JSON.parse(data).map(emoji => emoji.character);
                res.render('emojis', { emojis }); //emojis array
            } catch (error) {
                console.log("error")
            }
        });
    });
    //request err
    request.on('error', error => {
        console.error('Error making request:', error);
        res.status(500).send('Error making request');
    });

    // end it??
    request.end();*/
});

app.post('/login', (req, res) => {
    loginUser(req, res)
    //cant fail because a new user is created if there's no user found
});
app.get('/logout', (req, res) => {
    logoutUser(req, res);
});
app.post('/delete/:id', isAuthenticated, (req, res) => {
    //isauthenticated means the user is already verified???
    const postIndex = posts.findIndex(post => post.id === parseInt(req.params.id));
    //if posts exist???
    if(postIndex) {
        const post = posts[postIndex];
        if (post.username === getCurrentUser(req).username) {
            //remove from posts array, reverse maybe
            posts.splice(postIndex, 1);
            res.redirect('/');
        } else {
            //error
            console.log("oopdy");
        }
    }
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Server Activation
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Functions and Variables
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Example data for posts and users
let posts = [
    { id: 1, title: 'Sample Post', content: 'This is a sample postpppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp.', username: 'SampleUser', timestamp: '2024-01-01 10:00', likes: 0 },
    { id: 2, title: 'Sample Post', content: 'This is a sample pospppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppt.', username: 'SampleUser', timestamp: '2024-01-01 10:00', likes: 0 },
    { id: 3, title: 'Sam33ple Post', content: 'This is a sample post.', username: 'SampleUser', timestamp: '2024-01-01 10:00', likes: 0 },
    { id: 4, title: 'Sam444ple Post', content: 'This is a sample post.', username: 'SampleUser', timestamp: '2024-01-01 10:00', likes: 0 },
    { id: 5, title: 'Another Post', content: 'This is another sample post.', username: 'AnotherUser', timestamp: '2024-01-02 12:00', likes: 0 },
];
let users = [
    { id: 1, username: 'another', avatar_url: undefined, memberSince: '2024-01-01 08:00' },
    { id: 2, username: 'AnotherUser', avatar_url: undefined, memberSince: '2024-01-02 09:00' },
];

// Function to find a user by username
function findUserByUsername(username) {
    return users.find(user => user.username === username); //works?? js predefined func
    //rets undefined which cna be used in if statement, if found rets the userbname
}


// Function to find a user by user ID
function findUserById(userId) {
    //search the users dict?
    return users.find(user => user.id === userId);
}

// Function to add a new user
function addUser(username) {
    //caller func already checked if its a unique username
    const currentTime = new Date().toISOString(); //current time
    const newId = Math.floor(100000000 + Math.random() * 900000000); //random 9 digit number
    //should while loop check rand number to make sure its unique but its super unlikely anyway, lazy

    const avatar = handleAvatar(username[0]);
        const newUser = {
            id: newId, // Increment the maximum user ID to get the next available ID
            username: username,
            avatar_url: avatar,
            memberSince: currentTime
        };
        // Add the new user to the users array
        users.push(newUser);
    // Return the newly added user object
    //return newUser;
    //search if there is alreadya  user associated with username
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    //console.log(req.session.userId);
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Function to register a user
function registerUser(req, res) {
    //registerUSer(req,res)
    //app.[pst]
    //CREDIT TO POSNETT FROM LECTURE
    const username = req.body.username;
    console.log("trying to register:", username);
    if((findUserByUsername(username))) {
        res.redirect('/register?error=Username+already+exists');
    }
    else {
        //make new user
        addUser(username);
        req.session.userId = findUserByUsername(username).id;
        req.session.loggedIn = true;
        res.redirect('/'); //home?
    }
}
// Function to login a user
function loginUser(req, res) {
    const username = req.body.username;
    console.log("trying to login:", username);
    if((findUserByUsername(username))) {
        req.session.userId = findUserByUsername(username).id;
        req.session.loggedIn = true;
        res.redirect('/'); //todo go to profile, home for now
    }
    else {
        //dont make new user
        /*addUser(username);
        req.session.userId = findUserByUsername(username).id; //necessary?
        req.session.loggedIn = true;*/
        res.redirect('/register?error=Username+already+exists'); //will this work?!?
    }
}

// Function to logout a user
function logoutUser(req, res) {
    //const user = getCurrentUser(req) || {};
    req.session.userId = '';
    req.session.loggedIn = false;
    res.redirect('/login');
}

// Function to render the profile page
function renderProfile(req, res) {
    // TODO: Fetch user posts and render the profile page
    const posts = getPosts();
    //console.log(posts);
    const user = getCurrentUser(req) || {};
    //render changed from user to users
    const userPosts = posts.filter(post => post.username === user.username);
    return userPosts;
}

// Function to update post likes
function updatePostLikes(req, res) {
    //console.log(req);
    const postId = req.params.id;
    const post = posts.find(post => post.id === parseInt(postId));
    if (post) {
        post.likes++; // Increment post likes
        return true; // Likes updated successfully
    } else {
        return false; // Post not found
    }

}

// Function to handle avatar generation and serving
function handleAvatar(letter) {
    //USED TO BE REQ< RES
    //generateAvatar(req.username[0])
    //set the avatarurl in the user, get ucrrent user??
    const avatarBuffer = generateAvatar(letter);
    const avatarPath = `./public/css/avatars/${letter}.png`; 
    fs.writeFileSync(avatarPath, avatarBuffer);
    //ret url format
    return `/css/avatars/${letter}.png`;
}

// Function to get the current user from session
function getCurrentUser(req) {
    if(findUserById(req.session.userId)) {
        return findUserById(req.session.userId);
    }
    else {
        //todo error msg
        //res.redirect('/register?error=no+current+user');
    }
}

// Function to get all posts, sorted by latest first
function getPosts() {
    return posts.slice().reverse();
}
function getUsers() {
    return users.slice().reverse();
}
// Function to add a new post
function addPost(title, content, user) {
    const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const date = new Date();
    const day = date.getDate();
    const month1 = month[date.getMonth()];
    const year = date.getFullYear();

    const currDate = day + " " + month1 + " " + year;
    const newPost = {
        id: Math.floor(100000000 + Math.random() * 900000000),
        title: title,
        content: content, 
        username: user.username,
        timestamp: currentTime = currDate,
        likes: 0
    };
    posts.push(newPost);
}

// Function to generate an image avatar
function generateAvatar(letter, width = 100, height = 100) {
    // Steps:
    // 1. Choose a color scheme based on the letter
    // 2. Create a canvas with the specified width and height
    // 3. Draw the background color
    // 4. Draw the letter in the center
    // 5. Return the avatar as a PNG buffer
    const canvas1 = canvas.createCanvas(width, height);

    //not a func because not a <canvas> elemtn???
    const ctx = canvas1.getContext('2d');

    const numberLetter = letter.charCodeAt(0);

   
    //ctx.fillStyle  = rgb(numberLetter % 256,numberLetter+125 % 256,(numberLetter+80) % 256); //rgbbbbbbbbbbbbb
    ctx.fillStyle = `#${(numberLetter * 1234567).toString(16).slice(0, 6)}`;

    ctx.fillRect(0, 0, width, height);

    ctx.font = `${height * 0.5}px YourFontFamily`; //
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF'
    //ctx.fillStyle = rgb(255 - letterValue % 256, 255-letterValue + 200 % 256,256-letterValue+50 % 256);
    ctx.fillText(letter, width / 2, height / 2);

    //canvas to buffer
    return canvas1.toBuffer('image/png');
    //save img in directory??
}