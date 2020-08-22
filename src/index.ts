import "reflect-metadata";
import { createConnection, ConnectionOptions } from "typeorm";
import express from "express";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
// import { verify } from "jsonwebtoken";
// import { User } from "./entity/User";
// import { createRefreshToken, createAccessToken } from "./utils/auth";
// import { sendRefreshToken } from "./utils/sendRefreshToken";
import cookieParser from "cookie-parser";

import { UserResolver } from "./resolver/UserResolver";
import { MessageResolver } from "./resolver/MessageResolver";
import { ChannelResolver } from "./resolver/ChannelResolver";
import { createServer } from "http";
import {
  __prod__,
  FRONTEND_URL,
  BACKEND_URL,
  COOKIE_NAME,
  SESSION_SECRET,
} from "./constants";
import session from "express-session";

const PORT = process.env.PORT || 4000;
const databaseUrl = process.env.DATABASE_URL; // heroku specific

(async () => {
  const app = express();
  app.use(
    cors({
      origin: FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(
    session({
      name: COOKIE_NAME,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: __prod__ ? "none" : "lax",
        secure: __prod__,
        // path: "/refresh_token",
      },
      saveUninitialized: false,
      secret: SESSION_SECRET,
      resave: false,
    })
  );
  app.use(cookieParser());
  app.set("trust proxy", 1);

  if (databaseUrl) {
    const typeOrmOptions: ConnectionOptions = {
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
    await createConnection(typeOrmOptions);
  } else {
    await createConnection();
  }

  const server = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, MessageResolver, ChannelResolver],
      dateScalarMode: "isoDate", // "timestamp" or "isoDate"
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
  const httpServer = createServer(app);
  // without this no subscriptions lol
  server.installSubscriptionHandlers(httpServer);
  httpServer.listen(PORT, () => {
    console.log(
      `🚀 Server ready at ${BACKEND_URL}:${PORT}${server.graphqlPath}`
    );
    console.log(
      `🚀 Subscriptions ready at ws://${BACKEND_URL}:${PORT}${server.subscriptionsPath}`
    );
  });
})();
