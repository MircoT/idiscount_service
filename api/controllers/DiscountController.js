/**
 * DiscountController
 *
 * @description :: Server-side logic for managing Discounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const Shop = require('../models/Shop')
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'temporarySecretKey';

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDiscount() {
  return getRandomIntInclusive(5, 20);
}

module.exports = {
    create: (req, res) => {
        if (req.method == "POST") {

            let cur_discount = {
                number: Date.now(),
                discount: randomDiscount()
            };

            sails.models.shop.find().exec( (err, shops) => {
                if (!err) {
                    cur_discount.origin_shop = shops[getRandomIntInclusive(0, shops.length - 1)].name;
                    cur_discount.target_shop = shops[getRandomIntInclusive(0, shops.length - 1)].name;
                    cur_discount.token = jwt.sign(JSON.stringify(cur_discount), SECRET_KEY)

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
                    return res.serverError("Can't find any shop...");
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
            let beacon = req.body.OBJ.beacon;

            try {
                decoded = jwt.verify(req.body.OBJ.token, SECRET_KEY);
            } catch(err) {
                return res.serverError("Invalid token...");
            }

            sails.models.shop.findOne({name: decoded.origin_shop}).exec( (err, shop) => {
                if (!err) {
                    if (beacon.major === shop.major && beacon.minor === shop.minor) {
                        Discount.update({number: decoded.number}, {activated: true}).exec((updateErr, updated) => {
                            if (!updateErr) {
                                return res.send("ACTIVATED");
                            }
                            else {
                                return res.serverError("Can't activate this discount...");
                            }
                        });
                    }
                    else {
                        return res.serverError("Beacon not match...");
                    }
                }
                else {
                    return res.serverError("Can't find any shop with that name...");
                }
            });
        }
        else {
            return res.serverError("Method not allowed...");
        }
    },
    redeem: (req, res) => {
        if (req.method === "POST") {
            let decoded = "";
            let beacon = req.body.OBJ.beacon;

            try {
                decoded = jwt.verify(req.body.OBJ.token, SECRET_KEY);
            } catch(err) {
                return res.serverError("Invalid token");
            }

            sails.models.shop.findOne({name: decoded.target_shop}).exec( (err, shop) => {
                if (!err) {
                    if (beacon.major === shop.major && beacon.minor === shop.minor) {
                        Discount.findOne({number: decoded.number}).exec((discErr, discount) => {
                            if (!discErr) {
                                if (discount.activated && !discount.redeemed) {
                                    return res.send(discount.QrCode);
                                }
                                else {
                                    return res.serverError("Discount already redeemed...");
                                }
                            }
                            else {
                                return res.serverError("Can't find the discount...");
                            }
                        })
                    }
                    else {
                        return res.serverError("Beacon not match...");
                    }
                }
                else {
                    return res.serverError("Can't find any shop with that name...");
                }
            });
        }
        else {
            return res.serverError("Method not allowed...");
        }
    },
    verifyRedeem: (req, res) => {
        if (req.method === "POST") {
            let decoded = "";

            try {
                decoded = jwt.verify(req.body.OBJ.token, SECRET_KEY);
            } catch(err) {
                return res.serverError("Invalid token");
            }

            Discount.update({number: decoded.number}, {redeemed: true}).exec((updateErr, updated) => {
                if (!updateErr) {
                    return res.send("REDEEMED");
                }
                else {
                    return res.serverError("Something went wront on redeeming this discount...");
                }
            });
        }
        else {
            return res.serverError("Method not allowed...");
        }
    },
    index: (req, res) => {
        Discount.find().exec( (err, discounts) => {
            return res.view('discount/index', {'discounts': discounts});
        });
    },
};

