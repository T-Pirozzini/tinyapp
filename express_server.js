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



// render urls show
app.get("/urls/:shortURL", (req, res) => { 
  const shortURL = req.params.shortURL;  
  const longURL =  urlDatabase[req.params.shortURL].longURL;  
  const currentUserID = req.session.user_id;
  const userData = gatherUserData(currentUserID, users);  
  const templateVars = { shortURL, longURL, email: userData.email};
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
  // check if has cookie
  if (req.session.user_id) {
    console.log("user authenticated");
    next()
  } else {
    res.redirect("/register");
  }
  // if has valid cookie 
  // next()
  // else
  // redirect to somewhere or 401
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
  if (checkEmailRegistered(email, users)) {   
    return res.status(400).send("Error 400: The email is already registered");    
  }     
  req.session.user_id = id; 
  return res.redirect("/urls"); 
});

// login a user
app.post("/login", (req, res) => {  
  const { email, password } = req.body
  
  // if(email)

  // const user = findUserID(id, users);  
  // console.log("user", user);
  // if(!email) {
  //   return res.status(401).send('No user with that username found');
  // }

  // bcrypt.compare(password, user.password)
  //   .then((result) => {
  //     if (result) {        
  //       req.session.user_id = id;
  //       res.redirect('/urls');
  //     } else {
  //       return res.status(401).send('Password incorrect');
  //     }
  return res.redirect("/urls");
    });
  // 

//   if (!user) {
//     console.log("Enter an email and password");
//     return res.status(403).send("Error 403: Enter an email and password");
//   } else {
//     req.session.user_id = id;
//     return res.redirect(301, '/urls');    
//   }
// });

  // if(!email || !password) {
  //   console.log("Enter an email and password");
  //   return res.status(403).send("Error 403: Enter an email and password");
  // };
  // if(!user) {
  //   console.log("Email doesn't exist");
  //   return res.status(403).send("Error 403: Email doesn't exist");
  // };  
  // req.session.user_id = id;
  // 
//});

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

// AUTHENTICATED ROUTES
app.use(isAuthenticated);
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

 // use bcrypt to compare/check passwords
 const doesUserExist = (email, usersDatabase) => {
  for (let key in usersDatabase) {
    if(key === email) {      
      return email;
    }      
  }
  return false
}

// check if email is registered
const checkEmailRegistered = (email, usersDatabase) => {
  for (let user in usersDatabase) {  
    if(usersDatabase[user].email === email) { 
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


