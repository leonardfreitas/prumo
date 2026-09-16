<img src="https://raw.githubusercontent.com/stjosephworks/prumo/main/docs/brand/icon.png" alt="" width="28" align="left">

# Prumo's own documents

These describe **how Prumo is built**. None of them ships to a generated project. What ships is the
`.prumo/` folder, whose layout is in [`structure.md`](structure.md) and whose contents are the
knowledge base in `.prumo-templates/`.

| Document | Holds |
|---|---|
| [`stack.md`](stack.md) | What is locked: structural rules, installed packages, version floors, and what was deliberately dropped |
| [`structure.md`](structure.md) | The `.prumo/` layout a generated project receives: areas, inclusion rule, file naming, the index |
| [`document-template.md`](document-template.md) | The shape every document fills: five sections, voice, how much code, how many files |
| [`maintaining-templates.md`](maintaining-templates.md) | How a template is changed, how a change is proved, and the steps a regeneration undoes |
| [`DECISIONS.md`](DECISIONS.md) | Every decision taken, newest last: the options weighed, why one won, and what it costs |
| [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md) | What has been raised and is still unresolved, each naming what it blocks |

The hexagonal and Fastify era that preceded this one
is not here, and nothing in it is in force. It lives in the archive bundle described in
[`DECISIONS.md`](DECISIONS.md).
