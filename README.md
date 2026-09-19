# MC-Shade research note

An interactive research article on learned rendering for physical AI, with warehouse demonstrations and a matched detail comparison.

Live site: https://brandon56200.github.io/mc-shade/

## Develop

Requires Node.js 22.12+.

```sh
npm ci
npm run dev
```

## Validate

```sh
npm run lint
npm run build
```

Browser tests use installed Chrome. Run the dev server, then `npm test`. Set `BLOG_TEST_URL` to change the local test origin.

For a GitHub Pages path check, build with `npm run build -- --base=/mc-shade/`, serve it beneath that path, and run `PAGES_TEST_URL=<full-page-url> npx playwright test tests/pages.spec.js`.

## Publish

Pushes to `main` build and deploy the site using GitHub Actions. Public image and video references use Vite's configured base path so the project works at `/mc-shade/` as well as at a local root URL.

Only the article, website source, tests, and displayed media are included. Training code, model weights, internal experiment records, and working notes are not part of this repository.

## Demonstration scope

Warehouse examples are qualitative reconstructions on training trajectories of a scene-specific model. The reference is rendered in Unreal Engine; it is not a real photograph. The initial image uses reference-frame context and later images use generated history. Short clips are excerpts of full sequences; playback speed is not inference throughput. These examples do not demonstrate held-out scene generalization or real-robot transfer.

The limitations section includes a matched detail crop from the same reference and generated frame. Short clips remove shared letterboxing; no temporal smoothing or color correction is applied. Loops restart at the excerpt boundary.

## Credits

Typography: Satoshi by Indian Type Foundry / Fontshare, under the ITF Free Font License. See `public/fonts/NOTICE.txt`.

Brand and research media: Midcentury. This repository does not grant a separate license to the brand or research assets.
