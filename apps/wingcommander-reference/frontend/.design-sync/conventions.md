## Wingcommander conventions

This is KPI Hub's "Wingcommander" component library — shadcn/Radix-UI primitives, gold-on-navy brand. No global theme provider is required: all theming is plain CSS custom properties on `:root` (light, default) and a `.dark` class (KPI Hub navy dark theme) — add `className="dark"` to any ancestor element to switch themes, nothing to wrap.

**One real exception:** `Tooltip` requires its own local `<TooltipProvider>` wrapper around each usage (a Radix requirement, not project-specific) — without it, `Tooltip`/`TooltipTrigger`/`TooltipContent` throw a context error. `Dialog` and `DropdownMenu` need no wrapper; they're self-contained and portal their content to `document.body`.

### Styling idiom

Tailwind utility classes only — never inline styles, never a CSS-in-JS prop. Every color utility is backed by an HSL custom property, so swapping `.dark` on an ancestor re-themes every component automatically:

| Use | Classes |
|---|---|
| Page/surface | `bg-background text-foreground` |
| Primary action | `bg-primary text-primary-foreground` |
| Secondary action | `bg-secondary text-secondary-foreground` |
| Muted/quiet text | `text-muted-foreground`, `bg-muted` |
| Destructive | `bg-destructive text-destructive-foreground` |
| Card/popover surface | `bg-card` / `bg-popover` |
| Borders & focus | `border-input`, `border-border`, `ring-ring` |
| Corner radius | `rounded-lg`/`rounded-xl` (driven by `--radius`) |

Two brand-specific utilities beyond standard shadcn: `.glass` (translucent, backdrop-blurred surface — used by `Button`'s `glass` variant) and the `wing-400`…`wing-700` gradient color scale (used by `Button`'s `gradient` variant, e.g. `from-wing-500 to-wing-700`). Don't invent new color utilities outside this set — every shipped variant already uses one of the above.

### Where the truth lives

Read `styles.css` first — it's the one file to link, and its `@import` chain pulls in `_ds_bundle.css` (the compiled Tailwind output + every `--token` definition, real names verbatim). Per-component variant logic and prop shapes live in `components/<group>/<Name>/<Name>.d.ts` and `<Name>.prompt.md` — read those before composing a component you haven't used yet, especially for the `cva`-driven `variant`/`size` props on `Button` and `Badge`.

### Build with it

```jsx
const { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge } =
  window.ThekpihubWingcommanderFrontend;

<Card className="w-[360px]">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Deployment status</CardTitle>
      <Badge variant="success">Healthy</Badge>
    </div>
    <CardDescription>thekpihub-wingcommander-frontend · production</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">All health checks are passing.</p>
  </CardContent>
  <CardFooter className="justify-end gap-2">
    <Button variant="outline" size="sm">Dismiss</Button>
    <Button size="sm">View details</Button>
  </CardFooter>
</Card>
```

Compose subparts (`CardHeader`, `DialogTrigger`, `TooltipContent`, etc.) inside their parent, the way this example does — they aren't meant to stand alone.
