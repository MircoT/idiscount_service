/**
 * Seller.js
 *
 * @description :: A normal user of the private service, a seller of a shop.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  	attributes: {
	  	username: {
			type: 'string'
		},
		passwd: {
			type: 'string'
		},
		role: {
			type: 'string'
		}
	}
};

