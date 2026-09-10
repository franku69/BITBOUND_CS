# ADR 0001: Isolate rules; retain the static delivery model

Status: accepted for v27.

## Context

BITBOUND serves an IDE and an eight-world game from GitHub Pages. It must cache
the complete application, keep each student's work separate, retain the accepted
story and animation, and remain inexpensive to run on phones. v26 already split
game systems into files, but combined them into one shared closure; Lab page
selection, file commands, run handling and presentation occupied one controller.
Build stages and cache revisioning lived in one script.

## Decision

1. Use separate, platform-independent modules for game configuration, fresh state,
   learning order, plot schema, manual-save validation and the iframe protocol.
   Domain exports are explicit and private implementation names stay private.
2. Use native ES modules for Lab features. The page entry fetches curriculum and
   mounts one composition root. Views, file commands and execution have separate
   ownership. Worker cancellation is awaited before a loaded session replaces work.
3. Keep the existing single compiled game bundle. Pure game modules use
   declarations plus a final named export list; the build puts each into an
   isolated closure. This restricted conversion is checked and tested. It is not
   a general-purpose JavaScript transpiler.
4. Keep the hot simulation's shared entities and caches in its private composition
   scope. This avoids per-frame event plumbing or cloning the world state.
   Learning/save rules no longer depend on that scope.
5. Separate build stages and generate the offline manifest last. Rebuild in a
   disposable copy to prove committed outputs and a repeated build match exactly.
6. Add an acyclic module graph check, source registration checks, focused domain
   contracts, content fixtures and the existing full behavioral regressions to CI.

## Consequences

- No new runtime framework, package installation, server or database is required.
- Domains can be exercised directly in Node without booting a browser or game.
- Lab features have a small explicit dependency graph and cache revisions follow
  every nested native import.
- Simulation/rendering adapters still use the private shared game context. This
  is an intentional boundary, not a claim that every historical subsystem is an
  independently instantiable service.
- JavaScript syntax, runtime contracts and behavior are checked; the project does
  not claim complete static type checking. The architecture checker is a targeted
  guard for this source grammar, not a security sandbox or full JavaScript parser.
- CI is configured for Windows and Linux. Its presence does not imply those
  hosted runs or real-device acceptance have already been performed.
