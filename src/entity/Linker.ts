import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  BaseEntity,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Link } from "./Link";

@ObjectType()
@Entity("linkers")
export class Linker extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @CreateDateColumn()
  date: Date;

  @Field()
  @Column("text")
  title: string;

  @Field()
  @Column("text")
  description: string;

  // @Field(() => [String])
  // @Column("simple-array")
  // links: string[] = [];
  @Field(() => [Link], { nullable: true })
  @OneToMany(() => Link, (link) => link.linker)
  links: Link[] | null;

  @Field()
  @Column()
  userId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.linkers)
  user: User;
}
