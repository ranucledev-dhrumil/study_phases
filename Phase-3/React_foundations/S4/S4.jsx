// 1. What Tailwind actually is
// Tailwind is a utility-first CSS framework — instead of writing custom CSS classes with semantic names (.card, .btn-primary) and defining their styles separately, you compose pre-defined utility classes directly in your markup, each doing one small thing:

<div className="bg-white rounded-lg shadow-md p-4">
  <h2 className="text-xl font-bold text-gray-800">Title</h2>
  <p className="text-gray-600 mt-2">Some content</p>
</div>

// No separate .css file with a .card { background: white; border-radius: 8px; ... } block — the styling is the class list. This is a real philosophical shift from what you know (plain CSS, and conceptually similar to how Spring keeps config separate from code) — Tailwind deliberately puts style inline with structure, on the argument that co-locating them makes components easier to understand and delete safely (no orphaned CSS rules nobody dares remove).
// 2. Setup (Vite + React)
// npm install tailwindcss @tailwindcss/vite

// vite.config.js:
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})

// index.css (imported once in main.jsx):
// @import "tailwindcss";
// That's it for modern Tailwind (v4) — no tailwind.config.js required by default, no content paths to configure manually (v4 auto-detects). You'll still see older tutorials with a tailwind.config.js and content: [...] array — that's the v3 setup pattern; know it exists since you'll encounter it in older codebases/tutorials, but v4's setup is what you just did above.

// 3. Core utility categories
// Once set up, you're styling almost entirely through class names:

// | Category           | Examples                                                                     |
// | ------------------ | ---------------------------------------------------------------------------- |
// | **Spacing**        | `p-4` (padding), `m-2` (margin), `px-6` (padding-x), `gap-4` (flex/grid gap) |
// | **Sizing**         | `w-full`, `h-screen`, `max-w-md`                                             |
// | **Typography**     | `text-xl`, `font-bold`, `text-gray-800`, `leading-relaxed`                   |
// | **Color**          | `bg-blue-500`, `text-white`, `border-red-300`                                |
// | **Flexbox/Grid**   | `flex`, `flex-col`, `items-center`, `justify-between`, `grid`, `grid-cols-3` |
// | **Borders/Radius** | `border`, `border-2`, `rounded-lg`, `rounded-full`                           |
// | **Shadow**         | `shadow-sm`, `shadow-lg`                                                     |

// The numbers aren't arbitrary CSS values — they're steps on a design scale.
// p-4 isn't "4px," it's "4 steps on Tailwind's spacing scale" (which defaults to steps of 0.25rem, so p-4 = 1rem = 16px).
// Colors similarly follow a scale: blue-500 is the "base" blue, blue-100 is very light, blue-900 is very dark.
// This scale-based system is intentional — it keeps a whole app visually consistent because everyone's pulling from the same limited palette/spacing steps instead of inventing arbitrary pixel values everywhere.

// 4. Responsive design
// Mobile-first breakpoint prefixes — a bare utility applies to all sizes, a prefixed one applies from that breakpoint up:
{/* <div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div> */}

// This means: text-sm by default (mobile), overridden to text-base at md: (≥768px) and up, then text-lg at lg: (≥1024px) and up. Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px).

// 5. State variants (hover, focus, etc.)
<button className="bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 disabled:opacity-50">
  Submit
</button>
// Prefix any utility with a state modifier (hover:, focus:, active:, disabled:) and it only applies during that state — replaces what you'd otherwise need :hover/:focus pseudo-class blocks in separate CSS for.

// 6. Conditional/dynamic classes in React
// Since you're composing class strings in JSX, dynamic styling means conditionally building the class string:
function TaskItem({ task }) {
  return (
    <li className={`p-2 rounded ${task.done ? "bg-green-100 text-gray-400 line-through" : "bg-white"}`}>
      {task.title}
    </li>
  );
}

// For anything beyond trivial ternaries, a small utility library called clsx (or classnames) is standard practice to keep this readable:
import clsx from "clsx";

<li className={clsx("p-2 rounded", task.done && "bg-green-100 text-gray-400 line-through")}></li>
// clsx takes any number of strings/objects/conditionals and joins the truthy ones into a class string — cleaner than manually building template literals once you have 3+ conditional classes.

// 7. Component extraction pattern
// Tailwind's answer to "isn't this a lot of repeated classes?" is not a CSS abstraction (like @apply — technically available, but discouraged in v4-era best practice) but component extraction — since you're already in React, repeated utility combos become their own component:

function Button({ children, ...props }) {
  return (
    <button
      className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg"
      {...props}
    >
      {children}
    </button>
  );
}

// usage — no repeated class strings anywhere else
<Button onClick={handleSubmit}>Submit</Button>

// This leans directly on the composition instinct from Session 1 — instead of a reusable CSS class, you get a reusable component that happens to carry Tailwind classes internally. {...props} spreads any additional props (like onClick, disabled, type) through to the underlying <button>, so the component stays flexible.
