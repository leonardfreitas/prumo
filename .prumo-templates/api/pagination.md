# Pagination

## Rule

Paginate every list endpoint by cursor. The UUID v7 primary key is the cursor.

Order by id descending. `after` means *older than this*. Do not accept a sort parameter.

Accept two query parameters, declared on a query DTO: `limit`, defaulting to 20 and carrying
`@Max(100)`, and `after`.

Return `{ "data": [...], "nextCursor": "01J..." | null }`. Add nothing else: no `hasMore`, no
`total`, no nested `meta`.

Set `nextCursor` to the id of the last item on the page, or `null` when the page is the last one.

## Rationale

Offset pagination fails silently. Under concurrent inserts, page 2 repeats an item from page 1 or
skips one (no error, just a wrong list) and it degrades at depth, because the database counts and
discards every skipped row. A cursor is stable at any depth, and UUID v7 being time-ordered means the
id already is one: no extra sort column, no extra index.

That choice fixes the order. `WHERE id < :cursor ORDER BY id DESC` only works over one ordering, so a
sort parameter would break the cursor without erroring. Descending, because that is what a list screen
shows.

`hasMore` is omitted because a null `nextCursor` already says it, and a field derived from another
field can disagree with it. `total` is omitted because it costs a `COUNT` on every request: the most
expensive part of an otherwise cheap endpoint, paid whether or not anyone reads it. Adding it to one
route later breaks no client.

The parameters are an ordinary query DTO, so validation already covers them and the maximum is a
decorator rather than clamping logic. Clamping would return 100 rows to a client that asked for 500
without saying so, and the client would advance as though it had consumed 500.

## Applies to

Every endpoint returning a collection. Filtering is not covered here: a filter is a query DTO field
like any other, and it composes with the cursor without special handling.

## Examples

The response:

```
✅  { "data": [ ... ], "nextCursor": "01JQ8Z..." }
❌  { "data": [ ... ], "meta": { "page": 2, "total": 3204, "hasMore": true } }
```

The query DTO:

```
✅  @Max(100) limit: number = 20
❌  limit: number = 20        // no maximum; ?limit=1000000 is a denial of service
```

Ordering:

```
✅  GET /api/v1/orders?limit=20&after=01JQ8Z...
❌  GET /api/v1/orders?sort=total&page=3
```

## Enforcement

**Validation.** `limit`'s bounds are enforced by the pipe, and an unknown parameter (`page`, `sort`,
`offset`) is already rejected because unknown properties are forbidden.

**Review only.** That `nextCursor` is the last item's id and is null on the final page, and that a new
list endpoint paginates at all rather than returning an unbounded array.
