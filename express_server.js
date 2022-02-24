const express = require("express");
const app = express();
const port = 8081; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const e = require("express");

// view engine
app.set("view engine", "ejs");

// middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Objects/Database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
let users = {
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

// listening on ${port}
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});

// const authenticateUser = (email, password) => {
//   if (!email) {
//     return { error: "404", data: null };
//   }
//   if (email.password !== password) {
//     return { error: "404", data: null };
//   }
//   return { error: null, data: userDB[email] };
// };

// render urls_login
app.get("/login", (req, res) => {
  const templateVars = { email: req.cookies["user_email"] };
  return res.render("urls_login", templateVars);
});

const userExists = function(email, password) {
  for(let key in users){
    if(users[key].email === email && users[key].password === password) {
      return key;
    }    
  }  
}

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
  res.cookie("user_email", email)
  res.redirect("/urls");
});

// logout a user
app.post("/logout", (req, res) => {   
  res.clearCookie("user_email", req.body.email);
  res.redirect('/urls');
});

// parse json data
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
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

// register new user/render urls_registration
app.get("/register", (req, res) => { 
  const templateVars =  { email: req.cookies["user_email"]};
  return res.render("urls_register", templateVars);
});

// helper function - registration
const emailExists = (email, usersDB) => {
  for (let user in usersDB) {
    console.log(user);
    if (user.email === email) {
      return true; // return user id instead
    }
  }
  return false;
};

// registration endpoint
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
      res.cookie("user_email", users[id].email); 
      return res.redirect("/urls");
    }  
});

// redirect to LongURL after clicking on shortURL
app.get("/u/:shortURL", (req, res) => {     
  const longURL = urlDatabase[req.params.shortURL];  
  res.redirect(longURL);  
});

// create shortURL - generate random ID
app.post("/urls", (req, res) => {   
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL   
  res.redirect(`/urls/${shortURL}`);
});

// Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Edit a longURL
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id; // whatever the url is
  const newLongURL = req.body.input;
  urlDatabase[shortURL] = newLongURL;
  //console.log("body", req.body) // displays input: URL  
  res.redirect(`/urls/${shortURL}`);
});

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8); 
};


// EXAMPLE GET REQUESTS //
// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });