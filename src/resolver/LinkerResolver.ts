import {
  Resolver,
  Query,
  ObjectType,
  Field,
  Arg,
  Int,
  Ctx,
  Mutation,
  UseMiddleware,
} from "type-graphql";
import { Linker } from "../entity/Linker";
import { MyContext } from "./types/context";
import { getConnection } from "typeorm";
import { isAuth } from "../middleware/isAuth";
import { LinkerInput } from "../entity/types/Input";
import { Link } from "../entity/Link";
// import { User } from "../entity/User";

@ObjectType()
class PaginatedLinkers {
  @Field(() => [Linker])
  linkers: Linker[];
  @Field()
  hasMore: Boolean;
}

Resolver(Linker);
export class LinkerResolver {
  @Mutation(() => Linker)
  @UseMiddleware(isAuth)
  async createLinker(
    @Ctx() { req }: MyContext,
    @Arg("input") input: LinkerInput
  ) {
    // if (!req.session.userId) return null;
    const { userId } = req.session;
    const linker = await Linker.create({
      ...input,
      userId,
    }).save();
    const link = await Link.create({
      linkerId: linker.id,
      url: "example.com",
    }).save();
    await getConnection()
      .createQueryBuilder()
      .relation(Linker, "links")
      .of(linker)
      .add(link);
    return linker;
  }

  @Mutation(() => Link)
  @UseMiddleware(isAuth)
  async createLink(
    @Arg("url") url: string,
    @Arg("linkerId", () => Int) linkerId: number
  ) {
    return Link.create({
      linkerId: linkerId,
      url,
    }).save();
  }

  @Mutation(() => Linker, { nullable: true })
  async updateLinker(
    @Ctx() { req }: MyContext,
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Arg("description", () => String, { nullable: true }) description: string,
    @Arg("link", () => String, { nullable: true }) link: string
  ) {
    if (!req.session.userId) return null;
    if (!title && !description && !link) return null;
    const { userId } = req.session;
    const qb = getConnection().createQueryBuilder().update(Linker);
    if (title && description) {
      qb.set({ title, description });
    } else if (title) {
      qb.set({ title });
    } else if (description) {
      qb.set({ description });
    }
    if (link) {
      const linkObj = Link.create({ linkerId: id, url: link }).save();
      qb.relation(Linker, "links").of(id).add(linkObj);
    }
    const result = await qb
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
    const { userId } = req.session;
    await Linker.delete({ id, userId });
    return true;
  }

  @Query(() => PaginatedLinkers)
  async linkers(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ) {
    if (!req.session.userId) return null;
    const userId = req.session.userId;
    const realLimit = Math.min(10, limit);
    const realLimitPlusOne = realLimit + 1;

    const linker = getConnection()
      .getRepository(Linker)
      .createQueryBuilder("l")
      .innerJoinAndSelect("l.user", "u", "u.id = :userId", {
        userId,
      });

    linker
      .leftJoinAndSelect("l.links", "k", "k.linkerId = l.id")
      .orderBy("k.date", "ASC");

    const qb = linker
      .innerJoinAndSelect("l.user", "c", "c.id = l.user.id")
      .orderBy("l.date", "DESC")
      .take(realLimitPlusOne);
    // .orderBy({ "l.date": "DESC", "k.date": "ASC" });
    // .addOrderBy("k.date", "ASC");

    if (cursor) {
      qb.where("l.date < :cursor", {
        cursor: new Date(parseInt(cursor)),
      });
    }

    // const linkers = await qb.addOrderBy("k.date", "ASC").getMany();
    // const linkers = await qb.orderBy("k.date", "ASC").getMany();
    const linkers = await qb.getMany();
    // console.log(linkers.length);
    // const rawLinkers = await qb.getRawMany();
    // console.log(rawLinkers.entities);
    // console.log(rawLinkers.raw);
    return {
      linkers: linkers.slice(0, realLimit),
      hasMore: linkers.length === realLimitPlusOne,
    };
  }
}
