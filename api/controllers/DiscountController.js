/**
 * DiscountController
 *
 * @description :: Server-side logic for managing Discounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const QRCode = require('qrcode');

/**
 * Generate a random number from min to max included
 * @param  {integer} min
 * @param  {integer} max
 * @return {integer}
 */
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random discount from 5 to 20
 * @return {integer}
 */
function randomDiscount() {
  return getRandomIntInclusive(5, 20);
}

module.exports = {
    /**
     * @description Generate a new discount (method: [POST])
     * @return {string} success message or an error string
     */
    create: (req, res) => {
        if (req.method === "POST") {

            // Discount obj
            let cur_discount = {
                number: Date.now(),
                discount: randomDiscount()
            };

            // Get all shops
            sails.models.shop.find().exec( (err, shops) => {
                if (!err) {

                    // add some information to the discount
                    cur_discount.origin_shop = shops[getRandomIntInclusive(0, shops.length - 1)].name;
                    cur_discount.target_shop = shops[getRandomIntInclusive(0, shops.length - 1)].name;
                    // generate the token for this discount
                    cur_discount.token = sails.config.jwt.lib.sign(JSON.stringify(cur_discount), sails.config.jwt.secretKey)
                    // generate QrCode of the token
                    QRCode.draw(cur_discount.token, (error,canvas) => {
                        // convert QrCode canvas obj to Base64 image URL
                        cur_discount.QrCode = canvas.toDataURL();

                        cur_discount.activated = false;
                        cur_discount.redeemed = false;

                        // insert discount in the database
                        Discount.create(cur_discount).exec( (err, model) => {
                            if (!err) {
                                return res.send("Successfully Created!");
                            }
                            else {
                                return res.serverError("Something went wrong during the creation of the discount...");
                            }
                        });
                    });
                }
                else {
                    // Bad Request
                    res.status(400);
                    return res.send("Can't find any shop...");
                }
            });
        }
        else if (req.method === "GET") {
            return res.view('discount/create');
        }
        else {
            return res.forbidden("Method not allowed...");
        }
    },
    /**
     * @description Activate a discount (method: [POST])
     * @return {string} success message or an error string
     */
    activate: (req, res) => {
        if (req.method === "POST") {
            let decoded = "";
            let beacon_major = req.body.major;
            let beacon_minor = req.body.minor

            try {
                // verify the discount token
                decoded = sails.config.jwt.lib.verify(req.body.token, sails.config.jwt.secretKey);
            } catch(err) {
                // Bad Request
                res.status(400);
                return res.send("Invalid token...");
            }

            // earch the origin shop
            sails.models.shop.findOne({name: decoded.origin_shop}).exec( (err, shop) => {
                if (!err) {
                    // verify the beacon
                    if (beacon_major === shop.major && beacon_minor === shop.minor) {
                        // search the discount
                        Discount.findOne({number: decoded.number}).exec((errOne, discount) => {
                            if (!errOne) {
                                // verify the discount activation
                                if (discount.activated === false) {
                                    // update discount
                                    Discount.update({number: decoded.number}, {activated: true}).exec((updateErr, updated) => {
                                        if (!updateErr) {
                                            return res.send("ACTIVATED");
                                        }
                                        else {
                                            return res.serverError("Something went wrong during the activation of the discount...");
                                        }
                                    });
                                }
                                else {
                                    // Bad Request
                                    res.status(400);
                                    return res.send("Discount already activated...");
                                }
                            }
                            else {
                                // Bad Request
                                res.status(400);
                                return res.send("Can't find that discount...");
                            }
                        });
                    }
                    else {
                        // Bad Request
                        res.status(400);
                        return res.send("You're in the wrong shop...");
                    }
                }
                else {
                    // Bad Request
                    res.status(400);
                    return res.send("Can't find any shop with that name...");
                }
            });
        }
        else {
            return res.forbidden("Method not allowed...");
        }
    },
    /**
     * @description Redeem a discount (method: [POST])
     * @return {string} QrCode Base64 URL string or an error string
     */
    redeem: (req, res) => {
        if (req.method === "POST") {
            let decoded = "";
            let beacon_major = req.body.major;
            let beacon_minor = req.body.minor

            try {
                // verify the discount token
                decoded = sails.config.jwt.lib.verify(req.body.token, sails.config.jwt.secretKey);
            } catch(err) {
                // Bad Request
                res.status(400);
                return res.send("Invalid token");
            }

            // search the target shop
            sails.models.shop.findOne({name: decoded.target_shop}).exec( (err, shop) => {
                if (!err) {
                    // verify the beacon
                    if (beacon_major === shop.major && beacon_minor === shop.minor) {
                        // search the discount
                        Discount.findOne({number: decoded.number}).exec((discErr, discount) => {
                            if (!discErr) {
                                // verify the activation of the discount
                                if (!discount.activated) {
                                    // Bad Request
                                    res.status(400);
                                    return res.send("Discount not activated...");
                                }
                                // verify the redeem attribute
                                else if (discount.redeemed) {
                                    // Bad Request
                                    res.status(400);
                                    return res.send("Discount already redeemed...");
                                }
                                else {
                                    return res.send(discount.QrCode);
                                }
                            }
                            else {
                                // Bad Request
                                res.status(400);
                                return res.send("Can't find the discount...");
                            }
                        });
                    }
                    else {
                        // Bad Request
                        res.status(400);
                        return res.send("You're in the wrong shop...");
                    }
                }
                else {
                    // Bad Request
                    res.status(400);
                    return res.send("Can't find any shop with that name...");
                }
            });
        }
        else {
            return res.forbidden("Method not allowed...");
        }
    },
    /**
     * @description Verify the redeem code (method: [POST])
     * @return {string} success message or an error string
     */
    verifyRedeem: (req, res) => {
        if (req.method === "POST") {
            let decoded = "";

            try {
                // verify the device token
                decoded = sails.config.jwt.lib.verify(req.body.activation_token, sails.config.jwt.secretKey);
            } catch(err) {
                // Bad Request
                res.status(400);
                return res.send("Invalid device activation token");
            }

            try {
                // verify the discount token
                decoded = sails.config.jwt.lib.verify(req.body.token, sails.config.jwt.secretKey);
            } catch(err) {
                // Bad Request
                res.status(400);
                return res.send("Invalid token");
            }

            // search the device
            sails.models.device.findOne({uuid: req.body.uuid}).exec( (errDev, device) => {
                // verify the device
                if (!errDev && device !== undefined && device.activated === true) {
                    // search the discount
                    Discount.findOne({number: decoded.number}).exec((errOne, discount) => {
                        if (!errOne && discount !== undefined) {
                            // verify the discount
                            if (discount.activated === false) {
                                // Bad Request
                                res.status(400);
                                return res.send("Discount not activated...");
                            }
                            else if (discount.redeemed === false) {
                                Discount.update({number: decoded.number}, {redeemed: true}).exec((updateErr, updated) => {
                                    if (!updateErr) {
                                        return res.send(`${decoded.discount}% discount redeemed...`);
                                    }
                                    else {
                                        return res.serverError("Something went wrong during the redeem of the discount...");
                                    }
                                });
                            }
                            else {
                                // Bad Request
                                res.status(400);
                                return res.send("Discount already redeemed...");
                            }
                        }
                        else {
                            // Bad Request
                            res.status(400);
                            return res.send("Can't find that discount...");
                        }
                    });
                }
                else {
                    // Bad Request
                    res.status(400);
                    return res.send("Device not activated or not exists...");
                }
            });
        }
        else {
            return res.forbidden("Method not allowed...");
        }
    },
    /**
     * @description Show the discount list (method: [GET])
     * @return {string} the index view
     */
    index: (req, res) => {
        Discount.find().exec( (err, discounts) => {
            return res.view('discount/index', {'discounts': discounts});
        });
    },
};

