const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
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
};

describe('getUserByEmail', function() {
  it('should return a user with a valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = { email: "user@example.com" };    
    assert.equal(user.email, expectedUserID.email);    
  });

  it('should return a user with a valid password', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = { password: "purple-monkey-dinosaur" };
    assert.equal(user.password, expectedUserID.password);
  });  

  it('should return undefined with an invalid email', function() {
    const user = getUserByEmail('invalidEmail@example.com', testUsers);    
    assert.equal(user, undefined);
  });
 
});
