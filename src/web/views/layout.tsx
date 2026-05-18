import type { FC } from "hono/jsx";

export const Layout: FC = ({ children }) => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Fridge</title>
      <link rel="stylesheet" href="/dist.css" />
    </head>
    <body class="bg-gray-50 min-h-screen">
      <header class="bg-white border-b border-gray-200">
        <nav class="max-w-2xl mx-auto px-4 py-3 flex gap-6">
          <a href="/" class="font-bold text-emerald-600">
            Fridge
          </a>
          <a href="/meals" class="text-sm text-gray-600 hover:text-emerald-600">
            Meals
          </a>
          <a href="/pantry" class="text-sm text-gray-600 hover:text-emerald-600">
            Pantry
          </a>
          <a href="/shopping" class="text-sm text-gray-600 hover:text-emerald-600">
            Shopping
          </a>
        </nav>
      </header>
      {children}
    </body>
  </html>
);
