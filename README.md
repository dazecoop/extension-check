# extension-check

Possible to build a very simple web app that would check Chrome & Firefox extension stores for a given name/string/slug, and show if its available or not? And if not available, then suggest similar names that are available? I don't want any AI for this and we need to be mindful of rate-limit requests to both Firefox store & chrome store

Firefox store search: https://addons.mozilla.org/en-GB/firefox/search/?q=abc

Chrome store search: https://chromewebstore.google.com/search/abc123

Firefox store example extension slug: https://addons.mozilla.org/en-GB/firefox/addon/abc/

Chrome store example extension slug: https://chromewebstore.google.com/detail/speed-test/aeghledigokaedmpimgnfplidhdhlchg

Yeah that sounds reasonable/good. Lets build it. Minimal UI, nothing fancy, not paid. this will be open source/free. Make UI/UX nice.

Use this as guidance for UI - https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md

Use a best-effort matching name found / no match found check for Chrome, and an exact slug check for Firefox.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2836d2ed-38c2-47dd-81a7-9807a01f8608).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
