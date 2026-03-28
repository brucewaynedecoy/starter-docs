# Starter Docs Tasks

[ ] TASK01: Come up with and implement a strategy for "building" supporting documents (like agent instructions, templates, and references) for document "parts". That way the parts can be maintained, and "building" the `docs` directory or `skills` directory will rebuild the supporting documents from the parts. This would also give the CLI/wizard the ability to build supporting documents from maintained parts (rather than hardcoding the document parts directly in files under `src/`).

[ ] TASK02: Compare templates and references in `skills/decompose-codebase` skill against `docs/.templates` and `docs/.references` respectively. Come up with a strategy for creating document parts for supporting docs unique to the `decompose-codebase` skill.  Implement into the supporting docs factory that should be the outcome of `TASK01`.
