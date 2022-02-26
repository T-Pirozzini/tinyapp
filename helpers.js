const urlsForUser = (userId, urlDatabase) => {
  let userUrls = {};  
  for (let shortUrl in urlDatabase) {    
    if (urlDatabase[shortUrl].user_id === userId) {      
      userUrls[shortUrl] = urlDatabase[shortUrl];      
    }
  }  
  return userUrls;
}; 

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
    if (usersDB[user].id === currentuser_id) {
      return usersDB[user];
    }
  }
  return empty;
};


module.exports = {
  generateRandomString,
  getUserByEmail,
  gatherUserData,
  urlsForUser
};
