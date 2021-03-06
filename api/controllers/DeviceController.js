/**
 * DeviceController
 *
 * @description :: Server-side logic for managing Devices
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/**
 * Generate a random number from min to max included
 * @param  {integer} min
 * @param  {integer} max
 * @return {integer}
 */
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    /**
     * @description Visualization of the device list
     */
    index: (req, res) => {
        Device.find().exec( (err, devices) => {
            return res.view('device/index', {'devices': devices});
        });
    },
    /**
     * @description Add a new device (method: [POST])
     * @return {string} the device webpage by redirect or an error string
     */
    add: (req, res) => {
        if (req.method === "POST") {
            Device.find({ uuid: req.body.deviceID }).exec( (err, devices) => {
                if (!err && devices.length === 0) {
                    Device.create({ 
                        uuid: req.body.deviceID,
                        activationCode: getRandomIntInclusive(1000, 9999),
                        activated: false
                    }).exec((err, device) => {
                        if (!err) {
                            return res.redirect('/device');
                        }
                        else {
                            // Bad Request
                            res.status(400);
                            return res.send("Can't create that device...");
                        }
                    })
                }
                else {
                    // Bad Request
                    res.status(400);
                    return res.send("Device already inserted...");
                }
            });  
        }
        else {
            return res.forbidden("Method not allowed...");
        }
    },
    /**
     * @description Delete a device (method: [GET])
     * @return {string} the device webpage by redirect or an error string
     */
    delete: (req, res) => {
        if (req.method === "GET") {
            Device.destroy({ uuid: req.params.id }).exec((err, device) => {
                if (!err) {
                    return res.redirect('/device');
                }
                else {
                    // Bad Request
                    res.status(400);
                    return res.send("Can't delete that device...");
                }
            })
        }
        else {
            return res.forbidden("Method not allowed...");
        }
    },
    /**
     * @description Activate a device (method: [POST])
     * @return {string} the token for the device or an error string
     */
    activate: (req, res) => {
        if (req.method === "POST") {
            Device.findOne({ 
                uuid: req.params.id, 
                activationCode: req.body.activationCode, 
                activated: false})
            .exec( (err, device) => {
                console.log(err, device)
                if (!err && device !== undefined) {

                    let token = sails.config.jwt.lib.sign(JSON.stringify({
                        uuid: req.params.id, 
                        activationCode: req.body.activationCode
                    }), sails.config.jwt.secretKey)

                    Device.update(device, {
                        activated: true,
                        token: token
                    }).exec((err, device) => {
                        if (!err) {
                            return res.send(token);
                        }
                        else {
                            // Bad Request
                            res.status(400);
                            return res.send("Activation failed...");
                        }
                    })
                }
                else {
                    // Bad Request
                    res.status(400);
                    return res.send("Device id or activation code are wrong or device is already active...");
                }
            });
        }
        else {
            return res.forbidden("Method not allowed...");
        }
    }
};

