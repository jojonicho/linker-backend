import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  // UseMiddleware,
  Int,
} from "type-graphql";
import { hash, compare } from "bcryptjs";
// import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { MyContext } from "./types/context";
import { User } from "../entity/User";
import { RegisterInput } from "../entity/types/Input";
// import { sendRefreshToken } from "../utils/sendRefreshToken";
import { COOKIE_NAME } from "../constants";

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return "hello warudo!";
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) return null;
    return User.findOne(req.session.userId);
  }

  @Query(() => [User])
  users() {
    return User.find();
  }

  @Mutation(() => Boolean)
  async register(
    @Arg("input") { email, username, password }: RegisterInput
  ): Promise<boolean> {
    console.log(email, username, password);
    const hashedPassword = await hash(password, 12);
    try {
      const user = User.create({
        email,
        username,
        password: hashedPassword,
      });
      await user.save(); // important
      // await sendEmail(email, await createConfirmationUrl(user.id));
    } catch (err) {
      throw new Error(err);
    }
    return true;
  }

  // @Mutation(() => Boolean)
  // async confirmEmail(@Arg("token") token: string): Promise<boolean> {
  //   const userId = await redis.get(token);
  //   if (!userId) {
  //     return false;
  //   }
  //   await User.update({ id: parseInt(userId, 10) }, { confirmed: true });
  //   await redis.del(token);
  //   return true;
  // }

  @Mutation(() => Boolean)
  async revokeRefreshTokenUser(@Arg("userId", () => Int) userId: number) {
    await getConnection()
      .getRepository(User)
      .increment({ id: userId }, "tokenVersion", 1);
    return true;
  }

  @Mutation(() => User)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    // @Ctx() { req, res }: MyContext
    @Ctx() { req }: MyContext
  ): Promise<User> {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new Error("Invalid email");
    }

    const valid = await compare(password, user.password);

    if (!valid) {
      throw new Error("Invalid password");
    }

    //optional, cant really use redis with free heroku
    // if (!user.confirmed) {
    //   throw new Error("Please confirm your account");
    // }

    // login successful
    // sendRefreshToken(res, createRefreshToken(user));
    req.session.userId = user.id;

    return user;
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    // sendRefreshToken(res, "");
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}
