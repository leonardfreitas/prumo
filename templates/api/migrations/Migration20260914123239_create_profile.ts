import { Migration } from '@mikro-orm/migrations';

export class Migration20260914123239_create_profile extends Migration {

  override name = 'Migration20260914123239_create_profile';

  override up(): void | Promise<void> {
    this.addSql(`create table "profile" ("id" uuid not null default uuidv7(), "user_id" uuid not null, "display_name" text not null, "locale" text not null default 'en', "timezone" text not null default 'UTC', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), primary key ("id"));`);
    this.addSql(`alter table "profile" add constraint "profile_user_id_unique" unique ("user_id");`);
    this.addSql(`alter table "profile" add constraint "profile_user_id_foreign" foreign key ("user_id") references "auth"."user" ("id") on delete restrict;`);
  }

}
