/**
 * SellerController
 *
 * @description :: Server-side logic for managing Sellers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    /**
     * @description Login with a username and password (method: [GET, POST])
     * @return {string} GET  -> login page
     *                  POST -> the json of the correct logged in or an error string
     */
    login: function (req, res) {
        if (req.method == "GET")
            return res.view('seller/login');
        else if(req.method == "POST"){

            Seller.findOne({username:req.body.username})
            .exec( function (err, user) {

                if (user === null) 
                    return res.send("No such user");
                
                if (user.passwd !== req.body.passwd) 
                    return res.send("Wrong Password");
                
                req.session.username = req.body.username;
                req.session.role = user.role;   
                
                return res.json(req.session);
            })
            
        }
        else {
            return res.forbidden("Method not allowed...");
        }
    }
};

