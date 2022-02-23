const express = require("express");
const app = express();
const PORT = 8081; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// LISTENING ON PORT 8081
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// get cookies
app.get('/', (req, res) => {
  console.log('Cookies:', req.cookies)
})

// add login route


// parse json data
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// render urls_index
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// render urls_new
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// render urls show
app.get("/urls/:shortURL", (req, res) => {  
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
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
  // console.log(shortURL);  // Log the POST request body to the console
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
  const newLongURL= req.body.input;
  urlDatabase[shortURL] = newLongURL;
  console.log("body", req.body) // displays input: URL  
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



