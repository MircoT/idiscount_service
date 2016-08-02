/**
 * Device.js
 *
 * @description :: This model represents the devices available with the informations to enable them as verifier.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
  	uuid: {
		type: 'string'
	},
	activationCode: {
		type: 'string'
	},
	token: {
		type: 'string'
	},
	activated: {
		type: 'boolean'
	},
  }
};

