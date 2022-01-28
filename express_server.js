const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require('bcryptjs')

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: "session",
  keys: ['purple', 'monkey', 'dishwasher'],
  maxAge: 24 * 60 * 60 * 1000
}));

//Global Variables
const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "randomID"
  },
  s2m5xK: {
    longURL: "http://www.google.com",
    userID: "randomID"
  }
};
const users = {};
// const users = {
//   'randomId': {
//     id: 'randomID',
//     email: "a@b.com",
//     password: bcrypt.hashSync("1234")
//   },
// }

//Global Functions
//generates random 6 character string to act as a URL
const generateRandomString = () => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const length = characters.length;
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * length));
  }
  return result;
};

//verifies if email is in database
const verifyUserEmailinDatabase = (email, database) => {
  for (const user in users) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined
}

//returns the URLs where the userID is equal to the current id
const urlsForUser = (id) => {
  let userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

///Routing/////

app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});


// urls index page
app.get('/urls', (req, res) => {
  const userID = req.session['user_id']
  const userURLs = urlsForUser(userID)
  const templateVars = { urls: userURLs, user: users[userID] };
  res.render('urls_index', templateVars);
});

// submitting the form to shorten url
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session['user_id']
  }
  res.redirect(`/urls/${shortURL}`);
})

// new url 
app.get('/urls/new', (req, res) => {
  if (req.session['user_id']) {
    let templateVars = { user: users[req.session['user_id']] };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

// show both short and long urls
app.get('/urls/:shortURL', (req, res) => {
  const userID = req.session['user_id'];
  const userURLs = urlsForUser(userID)
  const templateVars = { urls: userURLs, user: users[userID], shortURL: req.params.shortURL };
  res.render('urls_show', templateVars);
});

// updates the longURL in the database
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.session['user_id'] === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.updatedURL;
  }
  res.redirect(`/urls/${shortURL}`);
});

// deletes a url from database, redirects to index page
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.session['user_id'] === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL]
  }
  res.redirect('/urls');
});

// redirection to real website
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.statusCode = 404;
    res.send('404 Not found')
  }
});

//register
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.session['user_id']] };
  res.render('urls_register', templateVars)
})
//register logic
app.post('/register', (req, res) => {

  if (req.body.email && req.body.password) {
    if (!verifyUserEmailinDatabase(req.body.email, users)) {
      const userID = generateRandomString();
      users[userID] = {
        userID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password)
      }
      req.session.user_id = userID;
      res.redirect('/urls');
    } else {
      res.statusCode = 400;
      res.send("400 Bad Request.  Email already in use")
    }
  } else {
    res.statusCode = 400;
    res.send('400 Please enter in all fields')
  }
});

// login page
app.get('/login', (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render('urls_login', templateVars);
});

// login logic
app.post('/login', (req, res) => {
  const user = verifyUserEmailinDatabase(req.body.email, users)
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.userID;
      res.redirect('/urls');
    } else if (req.body.password !== user.password) {
      res.statusCode = 403;
      res.send('<p>403 Invalid password</p>')
    }
  } else {
    res.statusCode = 403
    res.send('<p>403 User is not registered</p>')
  }
});

// logout clear cookies
app.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect('/urls');
})

// server listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
