import {
  Resolver,
  Query,
  ObjectType,
  Field,
  Arg,
  Int,
  Ctx,
  // UseMiddleware,
  Mutation,
} from "type-graphql";
import { Linker } from "../entity/Linker";
import { MyContext } from "./types/context";
// import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { User } from "../entity/User";

@ObjectType()
class PaginatedLinkers {
  @Field(() => [Linker])
  linkers: Linker[];
  @Field()
  hasMore: Boolean;
}

Resolver(Linker);
export class LinkerResolver {
  @Mutation(() => Boolean)
  async createLinker(
    @Ctx() { req }: MyContext,
    @Arg("title", () => String) title: string,
    @Arg("description", () => String) description: string
  ) {
    if (!req.session.userId) return null;
    const { userId } = req.session;
    const user = await User.findOne(req.session.userId);
    const linker = Linker.create({
      title,
      description,
      user,
      userId,
    });
    await linker.save();
    return true;
  }

  @Mutation(() => Linker, { nullable: true })
  async updateLinker(
    @Ctx() { req }: MyContext,
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String) title: string,
    @Arg("description", () => String) description: string
  ) {
    if (!req.session.userId) return null;
    const { userId } = req.session;
    const result = await getConnection()
      .createQueryBuilder()
      .update(Linker)
      .set({ title, description })
      .where('id = :id and "userId" = :userId', {
        id,
        userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Boolean)
  async deleteLinker(
    @Ctx() { req }: MyContext,
    @Arg("id", () => Int) id: number
  ) {
    if (!req.session.userId) return null;
    Linker.delete(id);
    return true;
  }

  @Query(() => PaginatedLinkers, { nullable: true })
  async linkers(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ) {
    // if (!req.session.userId) return null;
    const userId = req.session.userId;
    const realLimit = Math.min(10, limit);
    const realLimitPlusOne = realLimit + 1;

    const msg = getConnection().getRepository(Linker).createQueryBuilder("l");

    if (userId) {
      msg.innerJoinAndSelect("l.user", "u", "u.id = :userId", {
        userId,
      });
    }
    const qb = msg
      .innerJoinAndSelect("l.user", "c", "c.id = l.user.id")
      .orderBy("l.date", "DESC")
      .take(realLimitPlusOne);

    if (cursor) {
      qb.where("l.date < :cursor", {
        cursor: new Date(parseInt(cursor)),
      });
    }

    const messages = await qb.getMany();

    return {
      linkers: messages.slice(0, realLimit),
      hasMore: messages.length === realLimitPlusOne,
    };
  }
}
