# Module Federation Setup Guide

This guide walks you through integrating Native Federation for your three Angular apps: **ticket-booking-shell** (host), **movie-catelog** (remote), and **shopping-cart** (remote).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ticket-booking-shell (Host)                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                         Header                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐  │
│  │   movie-catelog (70%)     │  │   shopping-cart (30%)         │  │
│  │   - Movie list            │  │   - Cart items                │  │
│  │   - Add to cart           │──▶│   - Subtotal + Tax + Total    │  │
│  │   - Placeholder           │  │   - Placeholder               │  │
│  └──────────────────────────┘  └──────────────────────────────┘  │
│                                                                   │
│  Shell holds: Cart state + communicates with both remotes          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Install Native Federation

Install the package in **all three** projects:

```bash
cd movie-catelog
npm i @angular-architects/native-federation -D

cd ../shopping-cart
npm i @angular-architects/native-federation -D

cd ../ticket-booking-shell
npm i @angular-architects/native-federation -D
```

---

## Step 2: Initialize Remotes (movie-catelog & shopping-cart)

Run the init schematic for each remote:

```bash
# From module-federation root
cd movie-catelog
ng g @angular-architects/native-federation:init --project movie-catelog --port 4201 --type remote

cd ../shopping-cart
ng g @angular-architects/native-federation:init --project shopping-cart --port 4202 --type remote
```

This will:
- Create `federation.config.js` in each project
- Modify `main.ts` to bootstrap Native Federation
- Create `bootstrap.ts` (moves app bootstrap out of `main.ts`)

---

## Step 3: Initialize Host (ticket-booking-shell)

```bash
cd ticket-booking-shell
ng g @angular-architects/native-federation:init --project ticket-booking-shell --port 4200 --type dynamic-host
```

This creates:
- `federation.config.js`
- `src/assets/federation.manifest.json` (lists remotes)
- Modifies `main.ts` to load federation manifest first

---

## Step 4: Create Shared Types & Interfaces

Create a **shared** folder at the repo root for types used by all apps. This avoids duplication and keeps contracts consistent.

Create `module-federation/shared/models.ts`:

```typescript
export interface Movie {
  id: string;
  name: string;
  thumbnail: string;
  releaseDate: string;
  ticketPrice: number;
}

export interface CartItem {
  movie: Movie;
  quantity: number;
  total: number;
}
```

Each app will import from this path (e.g. `../../shared/models`). Alternatively, you can create a small npm package or use a shared library—for simplicity, a shared folder works.

---

## Step 5: Expose Components from Remotes

### movie-catelog

1. **Create the MovieList component** – Move the movie list UI from shell into `movie-catelog/src/app/movie-list/`:
   - `movie-list.component.ts`
   - `movie-list.component.html`

2. **Update `federation.config.js`** in movie-catelog – add to `exposes`:

```javascript
exposes: {
  './MovieList': './src/app/movie-list/movie-list.component.ts',
},
```

3. The MovieList component needs an **input** for `addToCart` callback (provided by shell).

### shopping-cart

1. **Create the ShoppingCart component** – Move the cart UI from shell into `shopping-cart/src/app/shopping-cart/`:
   - `shopping-cart.component.ts`
   - `shopping-cart.component.html`

2. **Update `federation.config.js`** in shopping-cart:

```javascript
exposes: {
  './ShoppingCart': './src/app/shopping-cart/shopping-cart.component.ts',
},
```

3. ShoppingCart needs **inputs** for `cart`, `subtotal`, `taxAmount`, `totalCost`, and **outputs**/callbacks for `removeFromCart`, `updateQuantity`.

---

## Step 6: Update Federation Manifest

Edit `ticket-booking-shell/src/assets/federation.manifest.json`:

```json
{
  "movie-catelog": "http://localhost:4201/remoteEntry.json",
  "shopping-cart": "http://localhost:4202/remoteEntry.json"
}
```

For production, replace `localhost` with your deployed URLs.

---

## Step 7: Load Remotes in Shell

### Option A: Load as Components in Routes

In `ticket-booking-shell/src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    loadComponent: () =>
      loadRemoteModule('movie-catelog', './MovieList').then((m) => m.MovieListComponent),
  },
  // ... or use a layout with named outlets
];
```

### Option B: Load in Shell Template (70/30 layout)

Use `loadRemoteModule` in the shell component and dynamic component loading:

1. In shell's `app.ts`, inject `ViewContainerRef` and use `loadRemoteModule` to get the component.
2. Use `ComponentRef` / `createComponent` to insert the remote into the placeholder.
3. Pass inputs (e.g. `addToCart`, `cart`) and subscribe to outputs.

Example shell template:

```html
<main class="flex-1 flex max-w-7xl w-full mx-auto px-6 py-6 gap-6">
  <section class="w-[70%]">
    <ng-container #movieCatalogHost></ng-container>
  </section>
  <section class="w-[30%]">
    <ng-container #shoppingCartHost></ng-container>
  </section>
</main>
```

You'll need to implement the loading logic in the shell component (e.g. in `ngAfterViewInit`).

---

## Step 8: Communication Between Shell and Remotes

**Strategy: Shell owns the cart state.**

| From        | To          | How                                                                 |
|-------------|-------------|---------------------------------------------------------------------|
| movie-catelog | shell       | Callback `addToCart(movie)` passed as `@Input()`                    |
| shell       | shopping-cart | Pass `cart`, `subtotal`, `taxAmount`, `totalCost` as `@Input()`      |
| shopping-cart | shell       | Callbacks `removeFromCart(id)`, `updateQuantity(id, delta)` as `@Input()` |

Flow:

1. Shell creates callbacks and passes them to movie-catelog and shopping-cart.
2. When user clicks "Add to Cart" in movie-catelog, it calls `addToCart(movie)`.
3. Shell updates its cart signal.
4. Shell passes updated `cart` to shopping-cart; shopping-cart updates via change detection.

---

## Step 9: Port Configuration

Ensure each app has a unique port in `angular.json`:

- **ticket-booking-shell**: 4200
- **movie-catelog**: 4201
- **shopping-cart**: 4202

Add under `serve` → `options` if needed:

```json
"options": {
  "port": 4201
}
```

---

## Step 10: Run Everything

**Terminal 1** – Start movie-catelog:
```bash
cd movie-catelog && ng serve
```

**Terminal 2** – Start shopping-cart:
```bash
cd shopping-cart && ng serve
```

**Terminal 3** – Start shell:
```bash
cd ticket-booking-shell && ng serve
```

Open `http://localhost:4200` to see the shell with both remotes.

---

## File Checklist

| Task | Location |
|------|----------|
| Move movie list UI | `movie-catelog/src/app/movie-list/` |
| Move cart UI | `shopping-cart/src/app/shopping-cart/` |
| Expose MovieList | `movie-catelog/federation.config.js` |
| Expose ShoppingCart | `shopping-cart/federation.config.js` |
| Federation manifest | `ticket-booking-shell/src/assets/federation.manifest.json` |
| Load remotes in shell | `ticket-booking-shell/src/app/app.ts` + template |
| Shared types | `shared/models.ts` |

---

## Troubleshooting

1. **CORS errors** – Remotes must allow the shell origin. The dev server usually handles this; for production, configure CORS on the remote servers.

2. **`remoteEntry.json` not found** – Ensure the remote is running and the port in the manifest matches.

3. **Shared dependency conflicts** – If you see version mismatch errors, inspect `federation.config.js` and adjust `shared` configuration.

4. **Component not found** – Verify the `exposes` path in `federation.config.js` matches the actual file path.

---

## Reference

- [@angular-architects/native-federation](https://www.npmjs.com/package/@angular-architects/native-federation)
- [Example repo (nf-standalone-solution branch)](https://github.com/manfredsteyer/module-federation-plugin-example/tree/nf-standalone-solution)
