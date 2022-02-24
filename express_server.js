// npm packages
const express = require("express");
const morgan = require("morgan");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
// npm packages - NOT IN USE
//const cookieParser = require("cookie-parser");

// global constants
const port = 8081; // default port 8080
const hashedPassword = bcrypt.hashSync(password, 10);

// view engine
app.set("view engine", "ejs");

// middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(cookieParser());
app.use(cookieSession({
  name: 'cookiemonster',
  keys: ['my secret key', 'yet another secret key']
})); 

// URL database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// USERS database
let users = {
  george: {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  karen: {
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
  const user = req.cookies;
  console.log(req.cookies);
  if (!user) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// render urls_index
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, email: req.cookies["user_email"] };
  res.render("urls_index", templateVars);
});

// render urls_new
app.get("/urls/new", (req, res) => {
  const templateVars = { email: req.cookies["user_email"] };
  return res.render("urls_new", templateVars);
});

// render urls show
app.get("/urls/:shortURL", (req, res) => {  
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], email: req.cookies["user_email"] };
  return res.render("urls_show", templateVars);
});

// redirect to LongURL after clicking on shortURL
app.get("/u/:shortURL", (req, res) => {     
  const longURL = urlDatabase[req.params.shortURL];  
  res.redirect(longURL);  
});

// register new user/render urls_registration
app.get("/register", (req, res) => { 
  const templateVars =  { email: req.cookies["user_email"]};
  return res.render("urls_register", templateVars);
});

// render urls_login
app.get("/login", (req, res) => {
  const templateVars = { email: req.cookies["user_email"] };
  return res.render("urls_login", templateVars);
});


// POST ROUTES //

// register a user
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  users[id] = {
    id,
    email,
    password: req.body.password
  }
  
  if (users[id].email === "") {           
    console.log("An email is required");
    res.status(400).send("Error 400: An email is required")
  } else if (users[id].password === '') {      
    console.log("A password is required");
    res.status(400).send("Error 400: A password is required");      
  } else if (emailExists(email, users)) {     
    console.log("You are already logged in!");
    res.status(400).send("Error 400: You are already logged in");
  } else {      
    bcrypt.compareSync("purple-monkey-dinosaur", hashedPassword); // returns true
    bcrypt.compareSync("pink-donkey-minotaur", hashedPassword); // returns false 
    return res.redirect("/urls");
  }  
});

// login a user
app.post("/login", (req, res) => {
  const { email, password} = req.body
  console.log("User", req.body)
  const user = userExists(email, password)
  if(!email|| !password) {
    console.log("Enter an email and password");
    return res.status(403).send("Error 403: Enter an email and password");
  };
  if(!user) {
    console.log("Email doesn't exist");
    return res.status(403).send("Error 403: Email doesn't exist");
  };  
  bcrypt.compareSync("purple-monkey-dinosaur", hashedPassword); // returns true
  bcrypt.compareSync("pink-donkey-minotaur", hashedPassword); // returns false
  res.redirect("/urls");
});

// logout a user
app.post("/logout", (req, res) => {   
  res.clearCookie("user_email", req.body.email);
  res.redirect('/urls');
});

// create shortURL - generate random ID
app.post("/urls", (req, res) => {   
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL   
  res.redirect(`/urls/${shortURL}`);
});

// Edit a longURL
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id; // whatever the url is
  const newLongURL = req.body.input;
  urlDatabase[shortURL] = newLongURL;
  //console.log("body", req.body) // displays input: URL  
  res.redirect(`/urls/${shortURL}`);
});

// Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// HELPER FUNCTIONS //

// check if email is registered
const emailExists = (email, usersDB) => {
  for (let user in usersDB) {
    console.log(user);
    if (user.email === email) {
      return true; 
    }
  }
  return false;
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

// listening on ${port}
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});