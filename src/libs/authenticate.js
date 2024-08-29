const jwt = require("jsonwebtoken");
const environment = require("../common/environment");

const authentication = async(req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");
    jwt.verify(token, environment.jwt.secret, (error, decode) => {
        if (error) return res.redirect('/login')
        req.user = decode
        next();
    })
};

const noAuthentication = async(req, res, next) => {
    const token = req.cookies.token;
    if (!token) return next()
    jwt.verify(token, process.env.JWT_SECRET, error => {
        if (error) return next()
        return res.redirect("/admin");
    });
}

module.exports = { authentication, noAuthentication };