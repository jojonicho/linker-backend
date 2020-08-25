"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_SECRET = exports.BACKEND_URL = exports.FRONTEND_URL = exports.COOKIE_NAME = exports.__prod__ = void 0;
exports.__prod__ = process.env.NODE_ENV === "production";
exports.COOKIE_NAME = "qid";
exports.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
exports.BACKEND_URL = process.env.BACKEND_URL || "http://localhost";
exports.SESSION_SECRET = process.env.SESSION_TOKEN_SECRET || "supersecretsecretsession";
//# sourceMappingURL=constants.js.map