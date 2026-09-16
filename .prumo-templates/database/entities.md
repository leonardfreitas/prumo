# Entities

## Rule

Declare an entity with `defineEntity` **and a class**. Put the schema in the `defineEntity` call and
no MikroORM decorators on the class. The class carries `@Exclude` and `@ApiProperty` only: the
serialization and documentation decorators.

Keep the default `UnderscoreNamingStrategy`. Table names are singular and match the class name;
columns are snake_case. Do not configure a naming strategy and do not set `tableName`.

Give every table `id`, `created_at` and `updated_at`. Let `id` be `uuid` with `DEFAULT uuidv7()`. Let
both timestamps be `timestamptz`, maintained by MikroORM's `onCreate` and `onUpdate`.

Add `tenant_id` to every tenant-scoped table. Add `deleted_at` only with a stated reason.

Map types as follows: money is `numeric`, text is `text`, JSON is `jsonb`, time is `timestamptz`, and
an enum is `text` with a CHECK constraint. Never `float` for money, never `varchar(n)`, never `json`,
never a native Postgres enum.

Index `tenant_id`, every foreign key column, and every column used to fetch a single row. Add any
other index on measurement, not on suspicion.

Declare `ON DELETE RESTRICT` on every foreign key. Use `CASCADE` only where the child cannot exist
without its parent, and say so where you use it.

## Rationale

The class exists because responses are serialized from the entity, which needs `@Exclude` to mark what
must not leave. `defineEntity` exists because v7 made it the primary path and it keeps the ORM's own
metadata off the class. The two are separate on purpose.

snake_case is not a style choice: Postgres folds an unquoted identifier to lower case, so a camelCase
column must be quoted in every hand-written query, psql session and dashboard, forever. Singular is the
strategy's default, so it costs nothing and makes the table name match the class name.

`numeric` because floating point does not represent 0.10 exactly and the error accumulates across a
sum. `text` because it performs identically to `varchar(n)` in Postgres while adding no limit that
hurts to change. `jsonb` because `json` stores raw text and cannot be indexed. A CHECK rather than a
native enum because adding a value to a native enum is painless but removing or reordering one
requires recreating the type and rewriting every dependent column.

The three mandatory indexes need no measurement, because they are consequences of the design.
**Postgres does not index the referencing side of a foreign key** (only the referenced side, by virtue
of being a primary key), so `order.customer_id` has no index unless someone declares it, and that is
the most commonly forgotten index there is.

`RESTRICT` matters because deletes are real here. `CASCADE` by default would remove a customer's
orders, invoices and payments in one transaction and return success, with no error and no warning.
`RESTRICT` makes that command fail and forces the decision into explicit code.

## Applies to

Every entity file, which lives inside its module's `entities/` directory.

## Examples

Naming:

```
✅  class User {}      → table user, column created_at
❌  class User {}      → table users, column createdAt
```

Money and enums:

```
✅  amount: numeric          status: text + CHECK (status IN (...))
❌  amount: double precision status: CREATE TYPE ... AS ENUM
```

Declaring text:

```
✅  displayName: p.text()     → text
❌  displayName: p.string()   → varchar(255)
```

Deletes:

```
✅  ON DELETE RESTRICT
❌  ON DELETE CASCADE        // on customer → order
```

## Enforcement

**Migration review.** Every rule here shows up as SQL in a migration, which is the one place a human
reads the schema as text. That makes migration review the real check, and the reason migrations are
generated as readable SQL rather than applied invisibly.

**Review only.** That a new table carries the structural columns, that a foreign key got its index, and
that each `CASCADE` was deliberate.

**A caveat worth knowing:** `user` is a reserved word in Postgres. `SELECT * FROM user` in psql returns
the session user, not the table, and does not error. Quote it: `FROM "user"`. The ORM always quotes
identifiers, so this only bites hand-written queries.
