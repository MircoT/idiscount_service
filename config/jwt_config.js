/**
 * Module to share all JWT library and variables
 * @type {Object}
 */
module.exports.jwt = {
    secretKey: 'temporarySecretKey',
    lib: require('jsonwebtoken')
};