/**
 * Discount.js
 *
 * @description :: Represents the discount emitted by a seller in a shop with the relative QrCode and token.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
	number: {
		type: 'string'
	},
	QrCode: {
		type: 'string'
	},
	token: {
		type: 'string'
	},
	origin_shop: {
		type: 'string'
	},
	target_shop: {
		type: 'string'
	},
	activated: {
		type: 'boolean'
	},
	redeemed: {
		type: 'boolean'
	}
  }
};

