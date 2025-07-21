'use strict';

var jwt = require('jwt-simple');
var moment = require('moment');

exports.createToken = function (user) {
  var payload = {
    sub: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    iat: moment().unix(),
    exp: moment().add(30, "days").unix,
  };

  // Use JWT_SECRET from environment variables with fallback
  var secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwt.encode(payload, secret);
};