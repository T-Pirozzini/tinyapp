// npm packages
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
// npm packages - NOT IN USE
// const cookieParser = require("cookie-parser");

// global constants
const app = express();
const port = 8081; // default port 8080

// view engine
app.set("view engine", "ejs");

// middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'] // must be a string and atleast one
})); 
// app.use(cookieParser());

// helper functions
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8); 
};

const getUserByEmail= (email, usersDatabase) => {
  for (const user in usersDatabase) {
    console.log(user);
    if (email === usersDatabase[user].email) {
      return usersDatabase[user];
    }
  }
  return null;
};

const gatherUserData = (currentuser_id, usersDB) => {
  let empty = {};
  for (let user in usersDB) {
    if (users[user].id === currentuser_id) {
      return users[user];
    }
  }
  return empty;
};

const urlsForUser = (userId, urlDatabase) => {
  let userUrls = {};  
  for (let shortUrl in urlDatabase) {    
    if (urlDatabase[shortUrl].user_id === userId) {      
      userUrls[shortUrl] = urlDatabase[shortUrl];      
    }
  }  
  return userUrls;
}; 

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
    return res.render("urls_register", templateVars);    
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

  const userUrls = urlsForUser(currentUser, urlDatabase)    
  const userData = gatherUserData(currentUser, users);  
  const templateVars = { currentUser, urlDatabase: userUrls, id: userData.id, email: userData.email };
  
  if (!currentUser) {
    return res.render("urls_register", templateVars);    
  };

  return res.render("urls_index", templateVars);
});

// render urls_new
app.get("/urls/new", (req, res) => {  
  const currentUser = req.session.user_id;  

  const userData = gatherUserData(currentUser, users);
  const urlData = urlsForUser(currentUser, urlDatabase);  
  const templateVars = { currentUser, id: userData.id, email: userData.email };
  if (!currentUser) {
    console.log("You are not logged in!");
    // res.send("Log in to access your URLS");
    return res.render("urls_error", templateVars);    
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
  const currentUser = req.session.user_id;  

  const shortURL = req.params.shortURL;  
  const longURL = urlDatabase[req.params.shortURL].longURL;  
  
  const userData = gatherUserData(currentUser, users);  
  const templateVars = { currentUser, shortURL, longURL, email: userData.email};
  return res.render("urls_show", templateVars);
});


// POST ROUTES //

// register a user
app.post("/register", (req, res) => {  
  const { email, password } = req.body;
  const id = generateRandomString();
  const currentUser = getUserByEmail(email, users);

  if (!email) {
    return res.send('Error: Please enter an email');
  }
  if (!password) {
    return res.send('Error: Please enter a password');
  }  
  if (currentUser) {
    return res.send('Error: A user with that email already exists');
  }

  // hash the password
  const salt = bcrypt.genSaltSync();
  const hashedPassword = bcrypt.hashSync(password, salt);

  // add newUser to database
  const newUser = {
    id,
    email,
    password: hashedPassword
  };

  users[newUser.email] = newUser;
  console.log(newUser);
  
  req.session.user_id = newUser.id;
  res.redirect('/urls'); 
});
  
// login a user
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

  req.session.user_id = user.id
  res.redirect('/urls');  
});  

// logout a user
app.post("/logout", (req, res) => {    
  req.session = null;
  res.redirect('/urls');
});

// create shortURL - generate random ID
app.post("/urls", (req, res) => {   
  const currentUser = req.session.user_id; 
  console.log("User", currentUser)
  console.log("all users", users)

  const shortURL = generateRandomString(); 

    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      user_id: currentUser
  }   
  console.log(currentUser);
  res.redirect(`/urls/${shortURL}`);
});

// Edit a longURL
app.post("/urls/:id", (req, res) => {
  const currentUser = req.session.user_id;
  const shortURL = req.params.id;
  const newLongURL = req.body.url;

  if(currentUser){  
    urlDatabase[shortURL].longURL =  newLongURL; 
  }

  res.redirect("/urls");
});

// Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});


// HELPER FUNCTIONS //



 

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



// check is user is registered
// const userExists = function(email, password) {
//   for(let key in users){
//     if(users[key].email === email && users[key].password === password) {
//       return key;
//     }    
//   }  
// }

const isAuthenticated = (req, res, next) => {
  // check if user has cookie  
  if (req.session.user_id) {
    console.log("user authenticated");
    next()
  } else {
    res.redirect("/login");
  }  
}





// listening on ${port}
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});


