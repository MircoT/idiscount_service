/**
 * Shop.js
 *
 * @description :: Model for the shops with a beacon associated.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
  	name: {
      type: 'string'
    },
    uuid: {
      type: 'string'
    },
    major: {
      type: 'integer'
    },
    minor: {
      type: 'integer'
    },
  }
};

