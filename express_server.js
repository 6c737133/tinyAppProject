// include the various package dependencies required
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

// define the template rendering engine and any further express extensions
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static('public'));

// define the URL database which would eventually be replaced by actual DB
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.ca"
};

// create a user object to facilitate registration/logic
var userDatabase = {
  "fakeUser1" : {
    id: "fakeUser1",
    email: "fakeUser1@email.com",
    password: "testpass1"
  },
  "fakeUser2" : {
    id: "fakeUser2",
    email: "fakeUser2@email.com",
    password: "testpass2"
  }
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
  let templateVars = {
    urls: urlDatabase,
    user: userDatabase
  };
  res.render("urls_index", templateVars);
});

// evidently /urls/:id is syntactically indifferent from /urls/new,
// so if you want the latter to function, it has to appear BEFORE the former within the code
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: userDatabase
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: userDatabase
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// create new end point to support registration
app.get("/register", (req, res) => {
  let templateVars = {
    user: userDatabase
  };
  res.render("urls_register", templateVars);
});

// create a login page to transfer responsibility from header to proper page
app.get("/login", (req, res) => {
  res.render("urls_login")
})

// first instance of something other than .GET
// this section will bring functionality to the form submissions
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  let templateVars = {
    user: userDatabase
  };
  urlDatabase[shortURL] = longURL;
  res.redirect(`http://localhost:8080/urls/${shortURL}`)
});

// insert functionality to delete a key/value pair
app.post("/urls/:id/delete", (req, res) => {
  let currentDB = urlDatabase;
  let entryToDelete = req.params.id;
  let templateVars = {
    user: userDatabase
  };
  delete currentDB[req.params.id];
  res.redirect("/urls");
});

// insert functionality to modify a key/value pair (change desintation URL)
app.post("/urls/:id/modify", (req, res) => {
  let currentDB = urlDatabase;
  let newLongURL = req.body.newLongURL;
  let templateVars = {
    user: userDatabase
  };
  currentDB[req.params.id] = newLongURL;
  res.redirect("/urls");
});

// insert login functionality - modified to accept real credentials
app.post("/login", (req, res) => {
  for (user in userDatabase) {
    if (req.body.email !== userDatabase[user].email) {
      return res.status(403).send('Invalid email or password');
    } else {
      if (req.body.password !== userDatabase[user].password) {
        return res.status(403).send('Invalid email or password');
      } else {
        res.cookie("user_id", userDatabase[user].id);
        res.redirect("/");
        }
      }
    };
  });

// insert logout functionality - need to clear the cookie and redirect
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// insert registration functionality and error handling
app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400);
  } else {
        for (user in userDatabase) {
          if (req.body.email == userDatabase[user].email) {
            return res.status(400);
          }
        }
      let newUserID = generateRandomString();
      userDatabase[newUserID] = {
        id: newUserID,
        email: req.body.email,
        password: req.body.password
      };
      res.cookie("user_id", newUserID);
      res.redirect("/urls");
    };
  });


// initialize the server and provide a console log to that effect
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


function generateRandomString() {
  var randomString = "";
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  do {
    for (var i = 0; i < 6; i++) {
      randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    };
  } while (urlDatabase[randomString]);
  return randomString;
}

