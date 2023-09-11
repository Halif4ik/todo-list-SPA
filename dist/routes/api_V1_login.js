"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiV1LoginRegisRoute = void 0;
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
exports.apiV1LoginRegisRoute = router;
const validator_1 = require("../midleware/validator");
const csrf_1 = __importDefault(require("csrf"));
const customer_1 = __importDefault(require("../models/customer"));
const { SEND_GRID_API_KEY, BASE_URL, HOST_EMAIL } = require('../constants');
const bcrypt = require('bcryptjs');
/*import {bcrypt} from 'bcryptjs';*/
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const mailer = nodemailer.createTransport(sgTransport({
    auth: {
        api_key: SEND_GRID_API_KEY,
    }
}));
let arrHexsFaces = ['👩‍🦰'.codePointAt(0), '👨‍🦲'.codePointAt(0), '👲'.codePointAt(0), `👧`.codePointAt(0)];
/*Login*/
router.post('/login', (0, validator_1.emailValidMiddleware)(), (0, validator_1.passwordValidInBodyMiddleware)(), validator_1.checkValidationInMiddleWare, async (req, res) => {
    try {
        const { login, pass } = req.body;
        const registeredCustomer = await customer_1.default.findAll({
            where: {
                login: login
            }
        });
        if (!registeredCustomer.length)
            return res.send({ errors: [{ "msg": "Wrong e-mail", }] });
        const isPass = await bcrypt.compare(pass, registeredCustomer[0].dataValues.pass);
        if (isPass) {
            req.session.customer = registeredCustomer;
            req.session.isAuthenticated = true;
            req.session.secretForCustomer = registeredCustomer[0].dataValues.csrf;
            req.session.face = registeredCustomer[0].dataValues.face;
            const tokens = new csrf_1.default();
            const secret = req.session.secretForCustomer;
            const tokenSentToFront = await tokens.create(secret);
            req.session.save(err => {
                if (err) {
                    console.log('Error with login user-', err);
                    throw err;
                }
                res.status(200).send({ 'ok': true, '_csrf': tokenSentToFront });
            });
        }
        else {
            return res.send({ error: 'not found' });
        }
    }
    catch (e) {
        console.log(e);
        res.sendStatus(400).send({ 'bad': false });
    }
});
/*logout*/
router.post('/logout', async (req, res) => {
    try {
        const registeredCustomer = req.session.customer;
        /*console.log('!!instanceof---',  req.session.customer instanceof (Model<CustomerModelStatic>));*/
        if (!registeredCustomer.length)
            return res.send({ errors: [{ "msg": "Wrong Logout", }] });
        else {
            req.session.isAuthenticated = false;
            req.session.secretForCustomer = '';
        }
        req.session.save(err => {
            if (err) {
                console.log('Error with login user-', err);
                throw err;
            }
            res.status(200).send({ 'ok': true });
        });
    }
    catch (e) {
        console.log(e);
        res.sendStatus(400).send({ 'bad': false });
    }
});
/*register*/
router.post('/register', (0, validator_1.emailValidMiddleware)(), (0, validator_1.passwordValidInBodyMiddleware)(), (0, validator_1.homePValid)(), validator_1.checkValidationInMiddleWare, async (req, res) => {
    const { login, pass, userName, homePage } = req.body;
    const registeredCustomer = await customer_1.default.findAll({
        where: {
            login: login
        }
    });
    if (registeredCustomer.length) {
        res.send({ errors: [{ "msg": "This e-mail is already register", }] });
        return;
    }
    /*create secret kay and token for hidden filds in forms*/
    const tokens = new csrf_1.default();
    const secretForCustomer = await tokens.secret();
    try {
        const emoji = arrHexsFaces[Math.floor(Math.random() * (arrHexsFaces.length - 1))];
        await customer_1.default.create({
            login,
            userName,
            homePage,
            face: emoji,
            pass: await bcrypt.hash(pass, 10),
            csrf: secretForCustomer
        });
        await mailer.sendMail({
            to: [login],
            from: HOST_EMAIL,
            subject: `Hi ${userName} you  are registered on SPA todo-List`,
            text: `Lorem ipsum dolor sit amet.`,
            html: `<h1>Thanks very match!</h1>
                    <p> You created account with this email- ${login}</p>
                    <hr/>
                    <a href="${BASE_URL}">Our SPA toto-list</a>`
        }, function (err, res) {
            if (err)
                console.log('errSendMail-', err);
        });
        res.status(200).send({ 'ok': true });
    }
    catch (e) {
        console.log('!!!-', e);
    }
});
//# sourceMappingURL=api_V1_login.js.map