import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  BaseEntity,
  CreateDateColumn,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { Linker } from "./Linker";

@ObjectType()
@Entity("links")
export class Link extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @CreateDateColumn()
  date: Date;

  @Field(() => String)
  @Column("text")
  url: string;

  @Field()
  @Column()
  linkerId: number;

  @Field(() => Linker)
  @ManyToOne(() => Linker, (linker) => linker.links, { onDelete: "CASCADE" })
  linker: Linker;
}
