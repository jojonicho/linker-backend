import { Request, Response } from "express";
// import { PubSub } from "apollo-server-express";

export interface MyContext {
  req: Request & { session: Express.Session };
  res: Response;
  pubsub: any;
  payload?: { userId: number };
}
