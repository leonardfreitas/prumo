# Modules

## Rule

Create one module per resource: `users`, `orders`, `invoices`.

A module contains exactly what `nest g resource` produces: `*.module.ts`, `*.controller.ts`,
`*.service.ts`, `dto/`, `entities/` and the co-located spec files. Add nothing to that set, **except further
services**.

Add a service to a module when a group of its methods has a name of its own that the resource's name does
not cover: `order-refunds`, `order-shipping`. Generate it with `nest g service <name> <module> --flat`, beside
the resource's service. Do not split by line count, and do not create a `services/` directory or one service
per action.

Two services in one module never inject each other in both directions.

Export the service. Mark every method that serves only its own module `private`.

Reach another module through `imports: [OtherModule]` and inject what it exports. Reference another
module's entity when a relation requires it.

Two modules never depend on each other. When they appear to, move the common part into a third
module. Do not use `forwardRef`.

Do not use barrel files inside a module.

Anything serving more than one module becomes its own module, named for what it does:
`notifications`, `pdf`, `storage`. There is no `SharedModule`.

A pure function is a function in a file, imported directly. It gets no module.

## Rationale

Nest supplies the mechanism and decides none of this, so every rule above exists to remove a choice
that would otherwise be made differently in each module and by each assistant.

One module per resource is the shape `nest g resource` generates and the shape every Nest example
already has, so the generator and the convention never disagree and a generated module needs no
correction afterwards. Designing an anatomy instead is what previously cost thirteen files per
feature, five of which carried no guarantee.

`private` makes the compiler enforce the module's surface, at no cost. A cycle is refused because
Nest's own guidance is to avoid one: `forwardRef` is its escape hatch, and its documented caveats
include an indeterminate order of instantiation, the class of failure that appears once in
production and does not reproduce. Barrel files are refused because Nest names them as a way to
create a cycle nobody can see.

**The extra service exists for the module that is large and still one thing.** Splitting into another
module is right when a second responsibility has crept in, and wrong when it has not: two modules sharing the
same entities and invariants end up wanting to call each other, which is the cycle refused above. Nest's own
answer is several providers in one module, and `nest g service <name> <module>` both creates the file and
registers it, so the generator and the convention still agree.

The criterion is a name rather than a size because a line limit ages and invites gaming: somebody moves
arbitrary methods out to pass the number, and the result is worse than the long file. `--flat` keeps the
anatomy one level deep. One service per action is refused on evidence: it is what produced thirteen files
per feature.

**What this costs:** the split is a judgement, held by review. And a module with several services can form a
cycle inside itself, which is why the cycle rule now reaches between services as well as between modules.

A `SharedModule` has no admission criterion, so it only grows. Requiring a name forces the question
*what is this*, and a module nobody can name should not exist.

## Applies to

Every module under `src/`. The rules about reaching across modules apply wherever one module's code
refers to another's.

## Examples

Exporting the service, with internals closed:

```
✅  export class UsersService {
      findById(id: string) {}
      private normaliseEmail(v: string) {}
    }

❌  export class UsersService {
      findById(id: string) {}
      normaliseEmail(v: string) {}   // reachable from any module that injects this
    }
```

Growing a module that is still one thing:

```
✅  orders/orders.service.ts
    orders/order-refunds.service.ts     // nest g service order-refunds orders --flat
❌  orders/services/cancel-order.service.ts
❌  refunds/refunds.module.ts           // needs orders' entities, and orders needs it back
```

Reaching another module:

```
✅  @Module({ imports: [UsersModule] })
❌  @Module({ imports: [forwardRef(() => UsersModule)] })
```

Importing inside a module:

```
✅  import { UsersService } from './users.service'
❌  import { UsersService } from './index'
```

## Enforcement

**Lint.** Barrel-file imports inside a module are verifiable and are caught by a lint rule.

**Review only.** Everything else. Nothing checks that a module maps to a resource, that an extra service
has a name of its own rather than an arbitrary slice, that a method that
should be `private` is, or that a `SharedModule` has not been created; a reviewer does. `private`
prevents accidental injection; it does not prevent someone widening the method next week to reach it.
