import type { FC } from "hono/jsx";

export const Layout: FC = ({ children }) => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Fridge</title>
      <link rel="stylesheet" href="/dist.css" />
    </head>
    <body class="bg-gray-50 min-h-screen">{children}</body>
  </html>
);
