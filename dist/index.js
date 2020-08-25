"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const UserResolver_1 = require("./resolver/UserResolver");
const LinkerResolver_1 = require("./resolver/LinkerResolver");
const http_1 = require("http");
const constants_1 = require("./constants");
const express_session_1 = __importDefault(require("express-session"));
const PORT = process.env.PORT || 4000;
const databaseUrl = process.env.DATABASE_URL;
(() => __awaiter(void 0, void 0, void 0, function* () {
    const app = express_1.default();
    app.use(cors_1.default({
        origin: constants_1.FRONTEND_URL,
        credentials: true,
    }));
    app.use(express_session_1.default({
        name: constants_1.COOKIE_NAME,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
            sameSite: constants_1.__prod__ ? "none" : "lax",
            secure: constants_1.__prod__,
        },
        saveUninitialized: false,
        secret: constants_1.SESSION_SECRET,
        resave: false,
    }));
    app.use(cookie_parser_1.default());
    app.set("trust proxy", 1);
    if (databaseUrl) {
        const typeOrmOptions = {
            type: "postgres",
            url: databaseUrl,
            synchronize: true,
            entities: ["src/entity/*.ts"],
            ssl: true,
            extra: {
                ssl: {
                    rejectUnauthorized: false,
                },
            },
        };
        yield typeorm_1.createConnection(typeOrmOptions);
    }
    else {
        yield typeorm_1.createConnection();
    }
    const server = new apollo_server_express_1.ApolloServer({
        schema: yield type_graphql_1.buildSchema({
            resolvers: [UserResolver_1.UserResolver, LinkerResolver_1.LinkerResolver],
            dateScalarMode: "isoDate",
        }),
        subscriptions: {
            path: "/subscriptions",
            onConnect: () => {
                console.log("yay");
            },
        },
        context: ({ req, res }) => ({ req, res }),
    });
    server.applyMiddleware({ app, cors: false });
    const httpServer = http_1.createServer(app);
    server.installSubscriptionHandlers(httpServer);
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server ready at ${constants_1.BACKEND_URL}:${PORT}${server.graphqlPath}`);
        console.log(`🚀 Subscriptions ready at ws://${constants_1.BACKEND_URL}:${PORT}${server.subscriptionsPath}`);
    });
}))();
//# sourceMappingURL=index.js.map