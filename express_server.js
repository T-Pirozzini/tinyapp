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
    password: "a"
  },
  user2RandomID: {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "b"
  }
};

// GET ROUTES //

// parse json data
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// current user redirect
app.get('/', (req, res) => {  
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});



// render urls_index
app.get("/urls", (req, res) => {  
  const currentUserID = req.session.user_id;
  const userData = gatherUserData(currentUserID, users);
  const urlData = gatherURLData(currentUserID, urlDatabase); 
  const templateVars = { urls: urlDatabase, id: userData.id, email: userData.email };
  return res.render("urls_index", templateVars);
});

// render urls_new
app.get("/urls/new", (req, res) => {  
  const currentUserID = req.session.user_id;
  const userData = gatherUserData(currentUserID, users); 
  const templateVars = { id: userData.id, email: userData.email };
  if (!currentUserID){
    return res.redirect("/login")
  };
  return res.render("urls_new", templateVars);
});

// redirect to LongURL after clicking on shortURL
app.get("/u/:shortURL", (req, res) => {     
  const longURL = urlDatabase[req.params.shortURL].longURL;    
  res.redirect(longURL);  
});

// render urls show
app.get("/urls/:shortURL", (req, res) => { 
  const shortURL = req.params.shortURL;  
  const longURL = urlDatabase[req.params.shortURL].longURL;  
  const currentUserID = req.session.user_id;
  const userData = gatherUserData(currentUserID, users);  
  const templateVars = { shortURL, longURL, email: userData.email};
  return res.render("urls_show", templateVars);
});

// register new user/render urls_registration
app.get("/register", (req, res) => {
  const currentUserID = req.session.user_id;
  const userData = gatherUserData(currentUserID, users); 
  const templateVars =  { id: userData.id, email: userData.email};
  return res.render("urls_register", templateVars);
});

// render urls_login
app.get("/login", (req, res) => {
  const currentUserID = req.session.user_id;
  const userData = gatherUserData(currentUserID, users); 
  const templateVars =  { id: userData.id, email: userData.email};
  return res.render("urls_login", templateVars);
});


// POST ROUTES //

const isAuthenticated = (req, res, next) => {
  // check if user has cookie  
  if (req.session.user_id) {
    console.log("user authenticated");
    next()
  } else {
    res.redirect("/login");
  }  
}

// register a user
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);  
  users[id] = {
    id,
    email,
    password: hashedPassword
  };
  
  if (!email) {        
    return res.status(400).send("Error 400: An email is required")
  }
  if (!password) {      
    return res.status(400).send("Error 400: A password is required");
  }      
  if (checkIfRegistered(email, users)) {   
    return res.status(400).send("Error 400: The email is already registered");    
  }     
  req.session.user_id = id; 
  return res.redirect("/urls"); 
});



// check if email is registered
const checkIfRegistered = (email, password, usersDatabase) => {
  for (let user in usersDatabase) {  
    if(usersDatabase[user].email === email) { 
      console.log('email matches')           
      bcrypt.compareSync(usersDatabase[user].password, password);
      console.log('password matches')
        return true; 
      }      
    }
    console.log('false'); 
  return false;
} 
  
// login a user
app.post("/login", (req, res) => {  
  const { email, password } = req.body;    
   if (checkIfRegistered(email, password, users)) {   
     req.session.user_id = "cookie"; // Not sure what this is supposed to be   
     res.redirect('/urls');
   };  
  return res.redirect('/login');
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
  
  urlsForUser(userID, users);
  
  res.redirect(`/urls/${shortURL}`);
});

// Edit a longURL
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const newLongURL = req.body.url;  
  urlDatabase[shortURL].longURL =  newLongURL; 
  res.redirect("/urls");
});

// Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});


// HELPER FUNCTIONS //

// gather all user data
const gatherUserData = (currentUserID, usersDB) => {
  let empty = {};
  for (let user in usersDB) {
    if (users[user].id === currentUserID) {
      return users[user];
    }
  }
  return empty;
};

// gather URL data
const gatherURLData = (id, urlDB) => {
  let urls = {};
  for (let url in urlDB) {
    if (urlDB[url].userID === id) {
      urls[url] = { longURL: urlDB[url].longURL, created: urlDB[url].created};
    }
  }
  return urls;
}  

 

// create random id
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8); 
};

// check is user is registered
// const userExists = function(email, password) {
//   for(let key in users){
//     if(users[key].email === email && users[key].password === password) {
//       return key;
//     }    
//   }  
// }



// return the URLS where the userID is equal to the id of the currently logged-in User
// NOT WORKING
const urlsForUser = function (id, obj) {
  for (let key in obj) {
    console.log("this is the key",key)
    console.log("userID",obj[key].userID)
    if (obj[key].userID === id) {
      return obj[key].longURL
    }
  }
}



// listening on ${port}
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});


