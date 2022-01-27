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
  "g6fh2A": {
    id: 1,
    email: "a@b.com",
    password: "1234"
  }
}

const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userID: "g6fh2A"
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: 'g6fh2A'
  }
};

const verifyEmail = function(email, usersDB) {
  for (let id in usersDB) {
    if (usersDB[id].email === email) {
      return usersDB[id];
    }
  }
  return false;
};

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

// urls index
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render('urls_index', templateVars);
});

//post create random string to act as a new URL
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies['user_id']
  }
  res.redirect(`/urls/${shortURL}`);
});

//new url      //comebackto this
app.get('/urls/new', (req, res) => {
  if (req.cookies['user_id']) {
    const templateVars = { user: req.cookies['user_id'] };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login')
  }
});


// get edit route
app.get('/urls/:shortURL/edit', (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.updatedURL;
  res.redirect(`/urls/${shortURL}`);
});

//update long URL
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = req.body.updatedURL;
  res.redirect(`/urls/${shortURL}`);
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
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});


app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies['user_id']] };
  res.render('urls_show', templateVars);
});

//GET registration 
app.get('/register', (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  let email = req.body.email;
  if (email) {
    if (!verifyEmail(email, users)) {
      const userID = generateRandomString();
      users[userID] = {
        userID,
        email: req.body.email,
        password: req.body.password
      }
      res.cookie('user_id', userID);
      res.redirect('/urls');
    } else {
      res.statusCode = 400;
      res.send('<p>400 Bad Request Email already registered</p>')
    }
  } else {
    res.statusCode = 400;
    res.render('<p>400 Bad Request Input an email and password</p>')
  }
});

//logout
app.post('/logout', (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/login');
});
//login
app.get('/login', (req, res) => {
  let templateVars = { user: users[req.cookies['user_id']] }
  res.render('urls_login', templateVars)
});
//login logic
app.post('/login', (req, res) => {
  let email = req.body.email;
  const user = verifyEmail(email, users);
  if (user) {
    if (req.body.password === user.password) {
      res.cookie('user_id', user.userID)
      res.redirect('/urls');
    } else {
      res.statusCode = 403;
      res.send('<p>403 Bad password</p>')
    }
  } else {
    res.statusCode = 403;
    res.send('<p>403 Email not registered</p>');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});