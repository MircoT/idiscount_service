/**
 * DiscountController
 *
 * @description :: Server-side logic for managing Discounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const QRCode = require('qrcode');

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDiscount() {
  return getRandomIntInclusive(5, 20);
}

module.exports = {
    create: (req, res) => {
        if (req.method === "POST") {

            let cur_discount = {
                number: Date.now(),
                discount: randomDiscount()
            };

            sails.models.shop.find().exec( (err, shops) => {
                if (!err) {
                    cur_discount.origin_shop = shops[getRandomIntInclusive(0, shops.length - 1)].name;
                    cur_discount.target_shop = shops[getRandomIntInclusive(0, shops.length - 1)].name;
                    cur_discount.token = sails.config.jwt.lib.sign(JSON.stringify(cur_discount), sails.config.jwt.secretKey)

                    QRCode.draw(cur_discount.token, (error,canvas) => {
                        cur_discount.QrCode = canvas.toDataURL();

                        cur_discount.activated = false;
                        cur_discount.redeemed = false;

                        Discount.create(cur_discount).exec( (err, model) => {
                            return res.send("Successfully Created!");
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
        else {
            return res.view('discount/create');
        }
    },
    activate: (req, res) => {
        if (req.method === "POST") {
            let decoded = "";
            let beacon_major = req.body.major;
            let beacon_minor = req.body.minor

            try {
                decoded = sails.config.jwt.lib.verify(req.body.token, sails.config.jwt.secretKey);
            } catch(err) {
                // Bad Request
                res.status(400);
                return res.send("Invalid token...");
            }

            sails.models.shop.findOne({name: decoded.origin_shop}).exec( (err, shop) => {
                if (!err) {
                    if (beacon_major === shop.major && beacon_minor === shop.minor) {
                        Discount.findOne({number: decoded.number}).exec((errOne, discount) => {
                            if (!errOne) {
                                if (discount.activated === false) {
                                    Discount.update({number: decoded.number}, {activated: true}).exec((updateErr, updated) => {
                                        if (!updateErr) {
                                            return res.send("ACTIVATED");
                                        }
                                        else {
                                            // Bad Request
                                            res.status(400);
                                            return res.send("Can't activate this discount...");
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
                        return res.send("Wrong shop...");
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
    redeem: (req, res) => {
        if (req.method === "POST") {
            let decoded = "";
            let beacon_major = req.body.major;
            let beacon_minor = req.body.minor

            try {
                decoded = sails.config.jwt.lib.verify(req.body.token, sails.config.jwt.secretKey);
            } catch(err) {
                // Bad Request
                res.status(400);
                return res.send("Invalid token");
            }

            sails.models.shop.findOne({name: decoded.target_shop}).exec( (err, shop) => {
                if (!err) {
                    if (beacon_major === shop.major && beacon_minor === shop.minor) {
                        Discount.findOne({number: decoded.number}).exec((discErr, discount) => {
                            if (!discErr) {
                                if (!discount.activated) {
                                    // Bad Request
                                    res.status(400);
                                    return res.send("Discount not activated...");
                                }
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
                        return res.send("Wrong shop...");
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
    verifyRedeem: (req, res) => {
        if (req.method === "POST") {
            let decoded = "";

            try {
                decoded = sails.config.jwt.lib.verify(req.body.activation_token, sails.config.jwt.secretKey);
            } catch(err) {
                // Bad Request
                res.status(400);
                return res.send("Invalid device activation token");
            }

            try {
                decoded = sails.config.jwt.lib.verify(req.body.token, sails.config.jwt.secretKey);
            } catch(err) {
                // Bad Request
                res.status(400);
                return res.send("Invalid token");
            }

            sails.models.device.findOne({uuid: req.body.uuid}).exec( (errDev, device) => {
                if (!errDev && device !== undefined && device.activated === true) {
                    Discount.findOne({number: decoded.number}).exec((errOne, discount) => {
                        if (!errOne && discount !== undefined) {
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
                                        // Bad Request
                                        res.status(400);
                                        return res.send("Something went wront on redeeming this discount...");
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
    index: (req, res) => {
        Discount.find().exec( (err, discounts) => {
            return res.view('discount/index', {'discounts': discounts});
        });
    },
};

