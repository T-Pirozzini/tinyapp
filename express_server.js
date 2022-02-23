const express = require("express");
const app = express();
const port = 8081; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")

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

// listening on ${port}
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});

// login a user
app.post("/login", (req, res) => {
  const logID = req.body.username;
  res.cookie("username", logID);  
  res.redirect("/urls");
});

// logout a user
app.post("/logout", (req, res) => {   
  res.clearCookie("username", req.body.username);
  res.redirect('/urls');
});

// parse json data
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// render urls_index
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

// render urls_new
app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  return res.render("urls_new", templateVars);
});

// register new user/render urls_registration
app.get("/register", (req, res) => { 
  const templateVars =  { username: req.cookies["username"] };
  return res.render("urls_register", templateVars);
});

// registration endpoint
app.post("/register", (req, res) => {
  const id = generateRandomString();
  users[id] = {
    id: [id],
    email: req.body.email,
    password: req.body.password
  }  
  res.cookie("user_id", id);  
  return res.redirect("/urls");
});

// render urls show
app.get("/urls/:shortURL", (req, res) => {  
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  return res.render("urls_show", templateVars);
});

// redirect to LongURL after clicking on shortURL
app.get("/u/:shortURL", (req, res) => {     
  const longURL = urlDatabase[req.params.shortURL];  
  res.redirect(longURL);  
});

// 
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



