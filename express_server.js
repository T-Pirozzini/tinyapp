// npm packages
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');

// global constants
const app = express();
const port = 8082;
const { generateRandomString, gatherUserData, getUserByEmail,urlsForUser } = require("./helpers");

// view engine
app.set("view engine", "ejs");

// middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
})); 

// URL database
const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      user_id: "aJ48lW",
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      user_id: "aJ48lW",
  }  
};

// USERS database
let users = {};

// parse json data
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// GET ROUTES //
app.get('/', (req, res) => {
  const currentUser = req.session.user_id;  
  const templateVars = { currentUser };

  if (!currentUser) {
    return res.render("urls_login", templateVars);    
  };  

  res.render('urls_index', templateVars)
});

app.get("/login", (req, res) => {
  const currentUser = req.session.user_id;
  const userData = gatherUserData(currentUser, users); 
  const templateVars =  { currentUser, id: userData.id, email: userData.email};

  return res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {
  const currentUser = req.session.user_id;
  const userData = gatherUserData(currentUser, users); 
  const templateVars =  { currentUser, id: userData.id, email: userData.email};

  return res.render("urls_register", templateVars);
});

app.get("/urls", (req, res) => {  
  const currentUser = req.session.user_id;
  const userUrls = urlsForUser(currentUser, urlDatabase);    
  const userData = gatherUserData(currentUser, users);  
  const templateVars = { currentUser, urlDatabase: userUrls, id: userData.id, email: userData.email };
  
  if (!currentUser) {
    return res.render("urls_error", templateVars);    
  };

  return res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {  
  const currentUser = req.session.user_id;
  const userData = gatherUserData(currentUser, users);    
  const templateVars = { currentUser, id: userData.id, email: userData.email };

  if (!currentUser) {        
    return res.render("urls_login", templateVars);    
  };

  return res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {     
  const longURL = urlDatabase[req.params.shortURL].longURL;
  const templateVars = longURL;

  if (!currentUser) {
    return res.send('Error: That URL does not belong to you'); 
  }

  res.redirect(longURL, templateVars);  
});

app.get("/urls/:shortURL", (req, res) => { 
  const currentUser = req.session.user_id;
  const shortURL = req.params.shortURL;  
  const longURL = urlDatabase[req.params.shortURL].longURL;  
  const userData = gatherUserData(currentUser, users);  
  const templateVars = { currentUser, shortURL, longURL, email: userData.email};

  if (!currentUser) {    
    return res.send('Error: That URL does not belong to you'); 
  }

  return res.render("urls_show", templateVars);
});

// POST ROUTES //
app.post("/register", (req, res) => {  
  const { email, password } = req.body;
  const id = generateRandomString();
  const currentUser = getUserByEmail(email, users);

  if (!email) {
    return res.send('Error: Please enter an email');
  };
  if (!password) {
    return res.send('Error: Please enter a password');
  };
  if (currentUser) {
    return res.send('Error: A user with that email already exists');
  };
  
  const salt = bcrypt.genSaltSync();
  const hashedPassword = bcrypt.hashSync(password, salt);
  
  const newUser = {
    id,
    email,
    password: hashedPassword
  };

  users[newUser.email] = newUser;  
  
  req.session.user_id = newUser.id;
  res.redirect('/urls'); 
});  

app.post("/login", (req, res) => {  
  const { email, password } = req.body;    

  if (!email) {
    return res.send('Error: Please enter an email');
  }
  if (!password) {
    return res.send('Error: Please enter a password');
  }
  const user = getUserByEmail(email, users); 
  if (!user) {
    return res.send('Error: user does not exist');
  }
  const result = bcrypt.compareSync(password, user.password);
  if (!result) {
    return res.send('Error: Passwords do not match');
  }

  req.session.user_id = user.id;
  res.redirect('/urls');  
}); 

app.post("/logout", (req, res) => {    
  req.session = null;
  res.redirect('/login');
});

// create shortURL - generate random ID
app.post("/urls", (req, res) => {   
  const currentUser = req.session.user_id; 
  const shortURL = generateRandomString(); 

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    user_id: currentUser
  };
  
  res.redirect(`/urls/${shortURL}`);
});

// Edit a longURL
app.post("/urls/:id", (req, res) => {
  const currentUser = req.session.user_id;
  const shortURL = req.params.id;
  const newLongURL = req.body.url;

  if (currentUser) {  
    urlDatabase[shortURL].longURL =  newLongURL; 
  };

  res.redirect("/urls");
});

// Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!currentUser) {
    return res.send('Error: That URL does not belong to you');    
  }
  
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// listening on ${port}
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});

