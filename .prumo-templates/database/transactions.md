# Transactions

## Rule

Open a transaction only where more than one operation must succeed or fail together. A single
`em.flush()` is already atomic.

Open it with `em.transactional(async em => …)`. Do not use the `@Transactional()` decorator, and never
write `begin` / `commit` / `rollback` by hand.

Keep every network call outside the transaction block: an email, a payment gateway, any HTTP request.

Leave the isolation level at READ COMMITTED. Where an invariant depends on reading a row and then
deciding, lock it with `SELECT … FOR UPDATE`. Do not raise the isolation level.

Do not retry a failed transaction. Fix the lock ordering instead.

## Rationale

`em.flush()` wraps its changes in an implicit transaction, so an explicit one is not for writing
correctly; it is for the case where two units of work must happen together. A per-request transaction
would last as long as the request, so a five-second timeout at an email provider becomes five seconds of
row locks; under concurrency that becomes a queue and the queue becomes an outage. The database ends up
paying for someone else's slowness.

The callback rather than the decorator, because the decorator makes the whole method the boundary and
cannot be narrowed. A method that writes two rows and also sends an email would sit entirely inside the
transaction with nothing in the code showing it. The decorator composes better through `REQUIRED`
propagation; that is given up because its failure mode is silent and only appears under load.

READ COMMITTED does not prevent read-decide-write: two requests read the same balance, both find it
sufficient, and both write. Nothing fails. `FOR UPDATE` is the local, visible fix: the second
transaction waits instead of aborting, so it needs no retry. Raising the isolation level would make
every transaction in the system need retry logic, including the ones that never conflicted.

A deadlock is an ordering bug, not bad luck, and retrying hides it: the system slows under load and
nothing ever fails loudly enough to be investigated. A retry also repeats whatever side effects already
happened outside the database.

## Applies to

Every service method that writes more than once.

## Examples

Keeping the network out:

```
✅  await em.transactional(async (em) => { … })
    await mailer.send(…)
❌  await em.transactional(async (em) => { … ; await mailer.send(…) })
```

Read, decide, write:

```
✅  const acc = await em.findOne(Account, id, { lockMode: LockMode.PESSIMISTIC_WRITE })
❌  const acc = await em.findOne(Account, id)   // two requests both pass the check
```

## Enforcement

**Review only, and one line of it matters more than anything else in this area:** that a read-decide-write
sequence locks the row. Nothing detects a missing `FOR UPDATE`. The failure is silent and expensive
(a negative balance, stock sold twice), and no transaction errors when it happens.

Also review: that no network call sits inside a transaction block, and that nobody added a retry
wrapper.
