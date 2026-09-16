# Components

## Rule

Style with NativeWind for everything it covers. Reach for a style object or `StyleSheet` only where an API
requires one (an animated style, a native prop that takes no `className`), and write one comment line
naming the API that required it.

Express variants with `cva`, in every component.

Extract a repeated class list on its **third** occurrence, and extract it as a component, never as a
string constant.

Do not sort classes automatically.

Put text styling on the `Text` element itself.

Treat `text-base` as *the base size on this platform*. Write an absolute value where a measurement must
match the web exactly.

## Rationale

The ladder off NativeWind is the same shape as the one off `em.find` in the database rules, because the
problem is the same: with no permission to step down, somebody forces the upper tool to do what it cannot;
with unlimited permission, the lower one becomes the default because it is familiar. The comment answers,
a year later, whether that `StyleSheet` was required or merely unfamiliar, which decides whether anyone
may simplify it.

**NativeWind's `rem` is 16 on web and 14 on native**, matching each platform's own default. `text-base` is
therefore not the same size in the two apps. On mobile alone that is invisible and correct; in a monorepo
it is the source of *why is the button smaller in the app?*, with the answer in neither codebase because
both say `text-base`. Forcing them to match would make every piece of text larger than in every other app
on the device, trading consistency with the platform for consistency with the other app of the same
product, and the user only sees the first.

NativeWind was chosen so one styling language would cross both clients. The **language** crosses; the
**scale** does not.

`cva` and the third-repetition rule carry over from the web area unchanged, for the reasons given there.

## Applies to

Every component under `src/`.

## Examples

Stepping off NativeWind:

```
✅  // Reanimated requires a style object for animated values
    <Animated.View style={animatedStyle} className="rounded-lg" />
❌  <Animated.View style={{ padding: 16, borderRadius: 8 }} />
```

Matching the web exactly:

```
✅  <View style={{ height: 48 }} />       // must match the web header
❌  <View className="h-12" />             // 42dp here, 48px there
```

## Enforcement

**Compiler.** `cva` makes variant names typed, so a misspelled variant does not build.

**Review only.** That a style object carries its reason, and that a third repetition was extracted.

**Five things worth knowing rather than discovering:**

NativeWind's Babel JSX runtime injects `react-native-css-interop` into the app's own files, so the app declares
that package even though no line of it is written by hand; without it the bundle cannot resolve the import.

NativeWind 4 uses Tailwind 3's `@tailwind` directives, which Biome does not recognise, so that one rule is off for
`global.css` alone.

The same class is not the same measurement across web and mobile. The language crosses; the scale does
not.

React Native does not cascade styles the way the web does, so text styling belongs on the `Text` element
rather than on an ancestor.

Automatic class sorting is worth revisiting when Biome's rule leaves the nursery group and its fix becomes
safe, the same condition recorded for the web.
