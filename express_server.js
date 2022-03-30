


const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bcrypt = require('bcryptjs');

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
const urlDatabase = {};
const users = {};


//Global Functions///////////////////////////

const { urlsForUser, getUserByEmail, generateRandomString } = require('./helpers');

///Routing/////

app.get('/', (req, res) => {
  const user_id = req.session.user_id
  if (user_id) {
    return res.redirect('/urls');
  }
  res.redirect('/login');
});

// urls index page
app.get('/urls', (req, res) => {
  if (!users) {
    res.redirect('/login');
  }
  const userID = req.session['user_id'];
  const userURLs = urlsForUser(userID, urlDatabase);
  const templateVars = { urls: userURLs, user: users[userID] };
  res.render('urls_index', templateVars);
});

// submitting the form to shorten url
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session['user_id']
  };
  res.redirect(`/urls/${shortURL}`);
});

// create a new url page. redirects if not logged in
app.get('/urls/new', (req, res) => {
  console.log(req.session)
  const userID = req.session.user_id
  if (userID) {
    let templateVars = { user: users[userID] };
    return res.render('urls_new', templateVars);
  }
  res.redirect('/login');
});

// show both short and long urls
app.get('/urls/:shortURL', (req, res) => {
  const userID = req.session['user_id'];
  const userURLs = urlsForUser(userID, urlDatabase);
  const templateVars = { userURLs, user: users[userID], shortURL: req.params.shortURL };
  res.render('urls_show', templateVars);
});

// redirects to an edit page
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
    delete urlDatabase[shortURL];
  }
  res.redirect('/urls');
});

// redirection to real website or error page if it doesn't exist
app.get('/u/:shortURL', (req, res) => {
  console.log(req.params)
  const shortURL = req.params.shortURL
  if (urlDatabase[shortURL]) {
    return res.redirect(urlDatabase[req.params.shortURL].longURL);
  }
  res.statusCode = 404;
  res.send('404 Not found');

});

//registeration page
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.session['user_id']] };
  res.render('urls_register', templateVars);
});
//register 
//adds user to database. If account is already in db or don't fill out all fields, an error page will display
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email && password) {
    if (!getUserByEmail(req.body.email, users)) {
      const userID = generateRandomString();
      users[userID] = {
        userID,
        email: email,
        password: bcrypt.hashSync(password)
      };
      req.session.user_id = userID;
      res.redirect('/urls');
    } else {
      res.statusCode = 400;
      res.send("400 Bad Request.  Email already in use. <a href='/register'>Register here</a>");
    }
  } else {
    res.statusCode = 400;
    res.send("400 Bad Request. Please enter in all fields. <a href='/register>Try Again.</a>");
  }
});

// login page
app.get('/login', (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render('urls_login', templateVars);
});

// login logic. compares passwords to hashed passwords. Will display error if not registered or give the wrong password
app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.userID;
      res.redirect('/urls');
    } else if (req.body.password !== user.password) {
      res.statusCode = 403;
      res.send("<p>403 Forbidden.  Invalid password. <a href='/register'>Try Again.</a> </p>");
    }
  } else {
    res.statusCode = 403;
    res.send('<p>403 User is not registered <a href="/register">Sign up Here</a></p>');
  }
});

// logout clear session cookies
app.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect('/login');
});

// server listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});