import { Resolver, Mutation, Arg, Int, UseMiddleware } from "type-graphql";
import { Link } from "../entity/Link";
import { getConnection } from "typeorm";
import { isAuth } from "../middleware/isAuth";

@Resolver(Link)
export class LinkResolver {
  @Mutation(() => Link)
  @UseMiddleware(isAuth)
  async updateLink(
    @Arg("url", () => String) url: string,
    @Arg("id", () => Int) id: number
  ) {
    const qb = await getConnection()
      .createQueryBuilder()
      .update(Link)
      .set({ url })
      .where("id = :id", { id })
      .returning(["id", "url", "date"])
      .execute();
    return qb.raw[0];
  }
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteLink(@Arg("id", () => Int) id: number) {
    await Link.delete(id);
    return true;
  }
}
