// include the various package dependencies required
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const hashed_password = bcrypt.hashSync("s34nQ", 10);
const cookieSession = require("cookie-session");

// define the template rendering engine and any further express extensions
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(cookieSession({
  name: "session",
  keys: ["s34nQu1ltY"]
}));

// initializean empty URL database which would be replaced by a real DB in the real world
var urlDatabase = {};

// initialize empty user databased which would be replaced by a real DB in the real world
var userDatabase = {};

// route to ensure a logged in user can only see the URLS that they created
app.get("/urls", (req, res) => {
  let userUrls = [];
  if (!req.session.user_id) {
    return res.redirect("/login");
  } else {
      for (key in urlDatabase) {
        if (req.session.user_id === urlDatabase[key].user) {
          userUrls.push(urlDatabase[key]);
       }
     }
  let templateVars = {
      currUrls: userUrls,
      userCookie: req.session.user_id
  }
    return res.render("urls_index", templateVars);
   }
});

// route to ensure only logged-in users can view the new URL page
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  let templateVars = {
    user: userDatabase,
    userCookie: req.session.user_id
  };
  return res.render("urls_new", templateVars);
});

// route for a specific short URL's info
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    return res.status(403).send("You are not authorized to access this resource.")
  } else {
        let templateVars = {
          urls: urlDatabase,
          shortURL: req.params.id,
          longURL: urlDatabase[req.params.id],
          user: userDatabase,
          userCookie: req.session.user_id
        }
      return res.render("urls_show", templateVars);
    }
});

// simple route to ensure the short URL routes to the long URL for anyone that attempts to GET it
app.get("/u/:shortURL", (req, res) => {
  return res.redirect(urlDatabase[req.params.shortURL].longURL);
});

// create new end point to support registration
app.get("/register", (req, res) => {
  let templateVars = {
    user: userDatabase,
    userCookie: req.session.user_id
  };
  return res.render("urls_register", templateVars);
});

// route for the login page
app.get("/login", (req, res) => {
  if (!req.session.user_id) {
    let templateVars = {
      user: userDatabase,
      userCookie: req.session.user_id
    }
    return res.render("urls_login", templateVars);
  } else {
      let userUrls = [];
        for (key in urlDatabase) {
          if (req.session.user_id === urlDatabase[key].user) {
            userUrls.push(urlDatabase[key]);
          }
        }
      let templateVars = {
        currUrls: userUrls,
        user: userDatabase,
        userCookie: req.session.user_id
      };
      return res.redirect("/urls");
    }
});

// this section will bring functionality to the form submissions
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;

  if (!req.session.user_id) {
      return res.redirect("/login");
    } else {
        urlDatabase[shortURL] = [shortURL]
        urlDatabase[shortURL].user = req.session.user_id
        urlDatabase[shortURL].shortURL = shortURL
        urlDatabase[shortURL].longURL = longURL

        res.redirect("/urls");
      }
});

// insert functionality to delete a key/value pair
app.post("/urls/:id/delete", (req, res) => {
  let currentDB = urlDatabase;
  let entryToDelete = req.params.id;
  let userId = req.session.user_id;
  let user = userDatabase[userId];
  let templateVars = {
    user: userDatabase
  };
  delete currentDB[req.params.id];
  return res.redirect("/urls");
});

// insert functionality to modify a key/value pair (change desintation URL)
app.post("/urls/:id/modify", (req, res) => {
  if (!req.session.user_id) {
    return res.status(403).send("You are not authorized to access this resource.")
  } else {
      urlDatabase[req.params.id].longURL = req.body.newLongURL;
    }
  let userUrls = [];
    for (key in urlDatabase) {
      if (req.session.user_id === urlDatabase[key].user) {
        userUrls.push(urlDatabase[key]);
      }
    }
    let templateVars = {
      user: userDatabase,
      currUrls: userUrls,
      userCookie: req.session.user_id
    };
  return res.render("urls_index", templateVars);
});

// insert login functionality
app.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(403).send("The email address or password provided are invalid.");
  };

  for (user in userDatabase) {
    if ((req.body.email === userDatabase[user].email) && (bcrypt.compareSync(req.body.password, userDatabase[user].password))) {
      req.session.user_id = userDatabase[user].id
      return res.redirect("/urls");
    }
  };
  return res.status(403).send("The email address or password provided are invalid.");
});

// insert logout functionality - need to clear the cookie and redirect
app.post("/logout", (req, res) => {
  req.session = null
  return res.redirect("/login");
});

// insert registration functionality and error handling
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("You must provide an email and password");
  };

  for (user in userDatabase) {
    if (req.body.email === userDatabase[user].email) {
      return res.status(400).send("That email address is already registered.");
    }
  };

  let newUserID = generateRandomString();
  let password = bcrypt.hashSync(req.body.password, 10);

  userDatabase[newUserID] = {
                              id: newUserID,
                              email: req.body.email,
                              password: password
                            };

  req.session.user_id = newUserID
  return res.cookie("user_id", newUserID).redirect("/urls");
});

// route to handle any URLs that do not have a defined route - all roads lead to login :-)
app.use("/", (req, res) => {
  return res.redirect("/login");
});

// initialize the server and provide a console log to that effect
app.listen(PORT, () => {
  console.log(`TinyApp is currently running, available at localhost:${PORT}!`);
});

// create function to generate random string, to be used for user ID creation & short URL creation
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

