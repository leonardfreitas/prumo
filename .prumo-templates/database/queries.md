# Queries

## Rule

Inject the `EntityManager`. Read with `em.find` and `em.findOne`, write with `em.persist` and
`em.flush`. **Do not use `@InjectRepository`.**

Declare every relation as `Ref<T>` or `Collection`. Access it only through `$`. State `populate` on
every read that needs the relation.

Reach for the QueryBuilder only where the operation does not exist in `em.find`: aggregation, window
functions, CTEs, upserts. Reach for raw SQL only where the QueryBuilder cannot express it either.
Write one comment line saying why, at each step down.

Apply the tenant rules to raw SQL exactly as to everything else.

Return the managed entity from a service. **Only the services of the module that owns an entity mutate
it.** A controller, an interceptor and a serializer read it and never write to it.

## Rationale

MikroORM's own guidance is that the `EntityManager` is the persistence API and repositories are an
extension point; `persist`, `flush` and `remove` were removed from repositories in v6 for being
shortcuts to it. Since nothing can be persisted without the `em`, using a repository as well would put
**two** doors in every service with a boundary somebody decides per method. This rule fights muscle
memory (every Nest-with-an-ORM example reaches for `@InjectRepository`), which is why it is written
negatively.

`Ref` and `$` turn N+1 from a review item into a compile error, because `Loaded<Entity, Hints>` tracks
what was populated and accessing `$` on an unloaded relation does not typecheck. N+1 is the most silent
database defect there is: the page works and merely gets slower as the list grows. Eager loading would
trade it for over-fetching on every query, invisible at the call site.

The comment on a QueryBuilder query exists because a year later nobody can tell whether it is there
because it was needed or because the author did not know how to express it otherwise, and that
difference decides whether anyone may simplify it.

An entity from `em.find` is managed, so changing it and flushing later writes to the database with no
`persist` call. That is the Unit of Work, accepted deliberately. The ownership rule is what keeps a
cosmetic change in an interceptor from becoming a write when some service downstream flushes.

## Applies to

Every service. The relation rules also shape how entities are declared.

## Examples

The door:

```
✅  constructor(private readonly em: EntityManager) {}
❌  constructor(@InjectRepository(User) private readonly users: EntityRepository<User>) {}
```

Relations:

```
✅  const u = await em.findOne(User, id, { populate: ['organization'] })
    u.organization.$.name
❌  const u = await em.findOne(User, id)
    u.organization.name
```

Dropping a level:

```
✅  // QueryBuilder: needs a window function, which em.find cannot express
❌  // (no comment)
```

## Enforcement

**Compiler.** Accessing an unpopulated relation through `$` does not typecheck. This is the only
compile-time guarantee in the area, and it covers the most expensive common defect.

**Review only.** That `@InjectRepository` did not creep back in, that each step down the query ladder
carries its reason, and that nothing outside the owning module's services mutates an entity. Nothing prevents the
last one (a managed entity and a detached one have the same shape), and its failure is silent: a
change made for display becomes a write on the next flush of that request.
