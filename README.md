# TODOS - FIX UP SEO

run this:

```bash
find . -type f -name '*.astro'
```

these files very closely resemble HTML, example:

@ LAnding Pages SEO
```astro
---
import Layout from 'src/layouts/Layout.astro';

export const prerender = true

// Fetch presale price at build time
let formattedPrice = '$0.001'; // fallback
try {
  const response = await fetch('https://devbackend.splitdo.app:8443/api/splitdo-token/program/info', {
    headers: {
      'Origin': 'https://splitdo.app'
    }
  });
  if (response.ok) {
    const data = await response.json();
    if (data.success && data.data?.exchange_rate) {
      const price = data.data.exchange_rate;
      formattedPrice = price >= 1 ? `$${price.toFixed(2)}` : `$${price.toFixed(3)}`;
      console.info(`✅ Presale price fetched: ${formattedPrice}`);
    }
  }
} catch (error) {
  console.warn('Failed to fetch presale price, using fallback:', error);
}
---

<Layout title="SPLITDO Token Presale - Join Early Access">
	Hello World
</Layout
```

With Layout, this is most likely where the SEO sits, inside ./src/layouts/Layout.astro

```astro
---
import DarkModeToggle from 'src/components-qwik/DarkModeToggle';
import 'src/styles/global.css';

export const prerender = true

export interface Props {
    title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
<head>

  <!-- THIS IS WHERE SEO METADATA GOES!!! -->
  <!-- THIS IS WHERE SEO METADATA GOES!!! -->
  <!-- THIS IS WHERE SEO METADATA GOES!!! -->
  <!-- THIS IS WHERE SEO METADATA GOES!!! -->
  <!-- THIS IS WHERE SEO METADATA GOES!!! -->

    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>

    <script is:inline>
        // Prevent flash of light mode
        const isDarkMode = localStorage.getItem('darkMode') === 'true' ||
            (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        }
    </script>
</head>
<body>
</body>
```

# App SEO

Run find ./src/pages -type f -name '\[...all\].astro'
Specifically ./src/pages/app/[...all].astro

Ask Claude what the heck this is, but here is a brief summary:

```text
An Astro catch-all does whatever a catch all route does, for an HTTP request:

  GET /app/ HTTP/1.1\r\n....
  GET /app/dashboard HTTP/1.1\r\n...

It will respond  with the exact same response for both

So /app/* load a SolidJS single page dashboard in this case,
Where the app is entirely client-side routed, like React Router
```

[...all].astro
```astro
---
// all JS catch-all server side logic here

/* server must execute logic on every request, not just at build time
* 'true' would generate static HTML at build
* static HTML does fuck all
*/
export const prerender = false
---
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <!-- THIS IS WHERE SEO METADATA GOES!!! -->
  <!-- THIS IS WHERE SEO METADATA GOES!!! -->
  <!-- THIS IS WHERE SEO METADATA GOES!!! -->
  <!-- THIS IS WHERE SEO METADATA GOES!!! -->
  <!-- THIS IS WHERE SEO METADATA GOES!!! -->

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SPLITDO Bill Splitting</title>

  <meta name="theme-color" content="#0A0E1A">
  <meta name="color-scheme" content="light dark">
</head>
<body>
</body>
```
