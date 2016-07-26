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
    create: function(req, res) {
        if (req.method == "POST") {

            let cur_discount = {
                number: Date.now(),
                discount: randomDiscount()
            };

            sails.models.shop.find().exec( (err, shops) => {
                if (!err) {
                    cur_discount.origin_shop = shops[getRandomIntInclusive(0, shops.length - 1)].name;
                    cur_discount.origin_shop = shops[getRandomIntInclusive(0, shops.length - 1)].name;
                    cur_discount.token = jwt.sign(cur_discount, SECRET_KEY)

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
    index: function(req, res) {
        Discount.find().exec( function(err, discounts) {
            return res.view('discount/index', {'discounts': discounts});
        });
    },
};

