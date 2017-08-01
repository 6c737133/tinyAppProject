// include the various package dependencies required
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");

// define the template rendering engine and any further express extensions
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

// define the URL database which would eventually be replaced by actual DB
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.ca"
};

// define the various routes required
// should later refactor this code & place in it's own module
app.get("/", (req, res) => {
  res.end("Hello!\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req ,res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
  longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// first instance of something other than get - this section will bring functionality to the form submissions
app.post("/urls", (req, res) => {
  console.log(req.body);   // this is a debug statement to illustrate the POST paramaters
  res.send("Ok");   // this just replies withi OK which will be customized later
});

// initialize the server and provide a console log to that effect
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


function generateRandomString() {
  let randomString = "";
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++) {
    randomString += chars.charAt(Math.floor(Math.random() * chars.length));
  };
  return randomString;
}
