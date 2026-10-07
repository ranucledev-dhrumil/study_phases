// 1. What MUI actually is (and how it differs philosophically from Tailwind)
// Material UI (MUI) is a component library, not a utility framework. Instead of giving you low-level utility classes to compose your own visual design, MUI gives you pre-built, pre-styled components implementing Google's Material Design system — buttons, cards, dialogs, form inputs, etc. — that already look polished out of the box.

import Button from '@mui/material/Button';
<Button variant="contained" color="primary">Submit</Button>

// Compare this to Tailwind's approach from Session 4, where you composed the styling from scratch (bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white) and extracted a Button component yourself to avoid repetition. MUI flips that: the component and its default styling both come from the library. You're customizing/theming an existing design system rather than building one utility-by-utility.

// This is the core trade-off to internalize:

// Tailwind = maximum control, you build the design system, more setup work per component, no visual opinions imposed.
// MUI = fast to a polished result, consistent Material Design look out of the box, less control unless you dig into theming/overrides, and your app will look recognizably "Google Material" unless heavily customized.

// 2. Setup
// npm install @mui/material @emotion/react @emotion/styled

// MUI uses Emotion internally (a CSS-in-JS library) to generate and inject styles at runtime — you don't need to touch Emotion directly for basic usage, just know it's the engine under the hood, similar to how you didn't need to think about Tailwind's build step once configured.

// 3. Core components
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';

function Example() {
  return (
    <Card>
      <CardContent>
        <TextField label="Title" variant="outlined" fullWidth />
        <Checkbox />
        <Button variant="contained">Save</Button>
      </CardContent>
    </Card>
  );
}

// Notice: no className styling happening here at all in the basic case — you configure appearance through props (variant, color, fullWidth, size), not utility classes. This is a fundamentally different mental model from Tailwind: MUI components have their own internal prop-driven API for common variations, and you reach for raw styling override tools only when the prop API doesn't cover what you want.

// Common variant values differ per component — Button has "text" | "outlined" | "contained", TextField has "outlined" | "filled" | "standard". You look these up in MUI's docs per-component rather than memorizing a universal utility vocabulary like Tailwind's.

// 4. The sx prop
// For one-off style overrides beyond what props cover, MUI gives you the sx prop — inline styling via a JS object, but with shorthand superpowers and access to your theme:
<Button sx={{ mt: 2, backgroundColor: 'success.main', '&:hover': { backgroundColor: 'success.dark' } }}>
  Confirm
</Button>
// mt: 2 — margin-top, using MUI's spacing scale (similar idea to Tailwind's m-2, but MUI's default unit is 8px per step, so mt: 2 = 16px).
// backgroundColor: 'success.main' — reaches into the current theme's color palette (success, error, warning, primary, secondary are theme palette keys) rather than a hardcoded hex.
// '&:hover': {...} — CSS-in-JS pseudo-selector syntax, the sx equivalent of Tailwind's hover: prefix.

// sx compiles down to actual CSS at runtime via Emotion — it's not inline style={{}} in the traditional sense (which can't do pseudo-selectors or media queries); sx supports both.

// 5. Theming
// MUI's real customization power is the theme — a single JS object controlling colors, typography, spacing globally, wrapped around your app once:
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#723231' },
    secondary: { main: '#FF6584' },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* every MUI component inside now uses your custom palette/typography */}
      <YourApp />
    </ThemeProvider>
  );
}

// This is MUI's answer to Tailwind's design-scale consistency — instead of every component individually picking from a fixed palette of utility classes, you define the palette once at the theme level, and every MUI component (Button color="primary", sx={{ color: 'primary.main' }}) automatically stays in sync with it. Change the theme's primary.main, and every primary-colored button/text across your entire app updates instantly — no find-and-replace across class strings.

// ThemeProvider uses React Context internally (the exact "avoid prop drilling" mechanism mentioned as a preview in Session 3) — it's how a value defined once at the top can be read by any MUI component anywhere in the tree without you manually passing theme as a prop through every layer.

// 6. Layout with MUI: Box, Stack, Grid
// MUI has its own layout primitives, since you're not writing flex/grid utility classes anymore:
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

<Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 2 }}>
  <Stack direction="row" spacing={2} alignItems="center">
    <TextField label="New task" size="small" />
    <Button variant="contained">Add</Button>
  </Stack>
</Box>
// Box is essentially a styled <div> — the sx-prop equivalent of a plain wrapper, comparable to how you'd reach for a <div className="p-4 bg-gray-100 rounded"> in Tailwind.
// Stack handles flex layouts declaratively via props (direction, spacing, alignItems) instead of you writing flex gap-4 items-center yourself.

// 7. Tailwind + MUI together — does that even make sense?

// You can use both in the same project (MUI components for structure/interactivity, Tailwind for anything MUI doesn't cover), but it's generally not recommended to mix them as your primary strategy in one component tree — you end up with two competing styling systems and specificity conflicts. Most real projects pick one as the primary system. Knowing both, as you're doing here, lets you make an informed choice per-project rather than defaulting to whichever you learned first.

// 8. When to reach for which (practical takeaway)
// Fast-turnaround admin panels, dashboards, internal tools where consistent, accessible, polished UI matters more than a unique visual identity → MUI.
// Marketing sites, landing pages, products with a distinct custom visual brand → Tailwind (or Tailwind + a component library like shadcn/ui, which you saw mentioned as available in this environment's artifact tooling).


//  sx accepts CSS-in-JS features like pseudo-selectors (&:hover) and theme-aware values (color.main), and compiles down to real CSS via Emotion at runtime. Plain inline style={{}} is limited to literal CSS properties and can't express pseudo-selectors or media queries.