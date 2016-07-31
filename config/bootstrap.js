/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

module.exports.bootstrap = function(cb) {
    Shop.create({
        name: "shop_1",
        uuid: "e031cced-1ce9-42c6-a936-83c78157d268",
        major: 4128,
        minor: 4129
      }).exec( function(err, model) {});

    Shop.create({
        name: "shop_2",
        uuid: "e031cced-1ce9-42c6-a936-83c78157d268",
        major: 21845,
        minor: 4369
    }).exec( function(err, model) {});

    Device.create({
        uuid: "EC0ACC02-C55E-4A4B-BD44-74BDFF7D2DDE",
        activationCode: "4242",
        activated: false,
        token: ""
    }).exec( function(err, model) {});

    Seller.create({
        username: 'test',
        passwd: 'test',
        role: 'seller'
    }).exec( function (err, model)  {});

    // It's very important to trigger this callback method when you are finished
    // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
    cb();
};
