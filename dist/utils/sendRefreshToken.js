"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRefreshToken = void 0;
const constants_1 = require("../constants");
exports.sendRefreshToken = (res, token) => {
    res.cookie("jid", token, {
        httpOnly: true,
        sameSite: constants_1.__prod__ ? "none" : "lax",
        secure: constants_1.__prod__,
        path: "/refresh_token",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });
};
//# sourceMappingURL=sendRefreshToken.js.map