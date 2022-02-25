// npm packages
const express = require("express");
const morgan = require("morgan");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session')
// npm packages - NOT IN USE
const cookieParser = require("cookie-parser");

// global constants
const port = 8081; // default port 8080
const password = "purple-monkey-dinosaur"; // found in the req.params object
const hashedPassword = bcrypt.hashSync(password, 10);

// view engine
app.set("view engine", "ejs");

// middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
})); 

// URL database
const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW",
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW",
  }  
};

// USERS database
let users = {
  userRandomID: {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

// GET ROUTES //

// parse json data
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//NOT WORKING YET
// current user redirect
app.get('/', (req, res) => {
  const user = req.session;
  console.log(req.session);
  if (!user) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// render urls_index
app.get("/urls", (req, res) => {  
  const currentUserID = req.session.user_id;
  const userData = gatherUserInfo(currentUserID, users); 
  const templateVars = { urls: urlDatabase, id: userData.id, email: userData.email, password: userData.password };
  res.render("urls_index", templateVars);
});

// render urls_new
app.get("/urls/new", (req, res) => {  
  const currentUserID = req.session.user_id;
  const userData = gatherUserInfo(currentUserID, users); 
  const templateVars = { userData };
  if (!currentUserID){
    return res.redirect("/login")
  };
  return res.render("urls_new", templateVars);
});

// render urls show
app.get("/urls/:shortURL", (req, res) => { 
  const shortURL = req.params.shortURL;  
  const longURL =  urlDatabase[req.params.shortURL].longURL;
  const currentUserID = req.session.user_id;
  const userData = gatherUserInfo(currentUserID, users);  
  const templateVars = { shortURL, longURL, id: userData.id, email: userData.email, password: userData.password };
  return res.render("urls_show", templateVars);
});

// redirect to LongURL after clicking on shortURL
app.get("/u/:shortURL", (req, res) => {     
  const longURL = urlDatabase[req.params.shortURL].longURL;  
  res.redirect(longURL);  
});

// register new user/render urls_registration
app.get("/register", (req, res) => {
  const currentUserID = req.session.user_id;
  const userData = gatherUserInfo(currentUserID, users); 
  const templateVars =  { id: userData.id, email: userData.email, password: userData.password};
  return res.render("urls_register", templateVars);
});

// render urls_login
app.get("/login", (req, res) => {
  const currentUserID = req.session.user_id;
  const userData = gatherUserInfo(currentUserID, users); 
  const templateVars =  { id: userData.id, email: userData.email, password: userData.password};
  return res.render("urls_login", templateVars);
});


// POST ROUTES //

// register a user
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const hashedPassword = bcrypt.hashSync(password, 10);  
  users[id] = {
    id,
    email,
    password: hashedPassword
  };
  
  if (users[id].email === "") {           
    //console.log("An email is required");
    res.status(400).send("Error 400: An email is required")
  } else if (users[id].password === '') {      
    //console.log("A password is required");
    res.status(400).send("Error 400: A password is required");      
  } else if (checkEmailRegistered(email, users)) {     
    //console.log("The email is alaready registered");
    res.status(400).send("Error 400: The email is already registered");    
  } else {     
    req.session.user_id = id; 
    return res.redirect("/urls");
  }  
});

// login a user
app.post("/login", (req, res) => {  
  const { email, password} = req.body
  const user = userExists(email, password)
  const id = findUserID(user, password, users);
  
  if(!email|| !password) {
    console.log("Enter an email and password");
    return res.status(403).send("Error 403: Enter an email and password");
  };
  if(!user) {
    console.log("Email doesn't exist");
    return res.status(403).send("Error 403: Email doesn't exist");
  };  
  req.session.user_id = id;
  return res.redirect("/urls");
});

// logout a user
app.post("/logout", (req, res) => {   
  req.session = null;
  res.redirect('/urls');
});

// create shortURL - generate random ID
app.post("/urls", (req, res) => {   
  const shortURL = generateRandomString(); 
  const userID = req.session.user_id; 
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID
  };     
  res.redirect(`/urls/${shortURL}`);
});

// Edit a longURL
app.post("/urls/:id", (req, res) => {
  // const shortURL = req.params.shortURL;
  // res.redirect(`/urls/${shortURL}`);

  const {id} = req.params;
  const userID = req.session['user_id'];
  const ownedURLs = urlsForUser(userID, urlDatabase);  
  const templateVars = {
    user: users[userID],
    id,
    url: urlDatabase[id]
  };
  res.render('urls_show', templateVars);
});

// Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// HELPER FUNCTIONS //

// gather all user info
const gatherUserInfo = (currentUserID, usersDB) => {
  let empty = {};
  for (let user in usersDB) {
    if (users[user].id === currentUserID) {
      return users[user];
    }
  }
  return empty;
};

// check if email is registered
const checkEmailRegistered = (email, usersDB) => {
  for (let user in usersDB) {  
    if(usersDB[user].email === email) { 
      return false; 
    }
  }
  return true;
};

// create random id
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8); 
};

// check is user is registered
const userExists = function(email, password) {
  for(let key in users){
    if(users[key].email === email && users[key].password === password) {
      return key;
    }    
  }  
}

const findUserID = (username, password, users) => {
  for (let nameInDB in users) {
    if (nameInDB === username) {
      const comparePasswords = bcrypt.compareSync(password, users[nameInDB].password);
      if (comparePasswords) {
        return users[nameInDB].id;
      }
    }
  }
  return false;
};

// listening on ${port}
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});