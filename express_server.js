const express = require('express');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

//Global Variables
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
// users object
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const verifyEmail = function(email, password) {
  for (let id in users) {
    console.log(users)
    if (users[id].email === email && users[id].password === password) {
      return users[id];
    }
  }
  return false
};

verifyEmail('user2@example.com')

// Routing
app.get('/', (req, res) => {
  res.send('Hello');
});


app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render('urls_index', templateVars);
});

//post create random string to act as a new URL
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});



// get edit route
app.get('/urls/:shortURL/edit', (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.updatedURL;
  res.redirect(`/urls/${shortURL}`);
});

//post edit update
app.post('/urls/:shortURL/update', (req, res) => {
  const shortURL = req.params.shortURL;
  const updatedURL = req.body.updatedURL;
  urlDatabase[shortURL] = updatedURL;
  res.redirect('/urls');
});
// app.get('/example/:apple/:orange', (req, res) => {
//   console.log(req.params)

//   res.send('ok')
// });

//deletes URL, redirects to URL index
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});



// short url
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];

  res.redirect(longURL);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render('urls_show', templateVars);
});


//GET registration 
app.get('/register', (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (email && password) {
    if (!verifyEmail(email)) {
      const userID = generateRandomString();
      users[userID] = {
        id: userID,
        email: req.body.email,
        password: req.body.password
      }
      res.cookie('user_id', userID);
      res.redirect('/urls');
    } else {
      res.statusCode = 400;
      res.render('400 Bad Request Email already registered')
    }
  } else {
    res.statusCode = 400;
    res.send('400 Bad Request Input an email and password')
  }
});




app.post('/logout', (req, res) => {
  res.clearCookie("username");
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});
//new url
app.get('/urls/new', (req, res) => {
  const templateVars = { username: req.cookies['username'] };
  res.render('urls_new', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});