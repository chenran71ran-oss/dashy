# Icon loading performance

## Findings

The branch starts from master `de006f91049ae329174c2948f9d8da138ac725d4` (PR #15). Existing unmerged work is not silently included.

- Successful `/api/icon-image` responses inherited `Cache-Control: no-store`. Even with the image in Worker KV, remounting a card required a browser-to-Worker request, authentication and a KV read.
- Discovery promises were cached, but their resolved icon URLs were not available synchronously to a remounted card. Its initial image was the root favicon, followed by the previously discovered application icon after the promise completed.
- Discovery retained only 64 entries. Larger bookmark collections could evict results while switching sections.
- Native lazy loading delayed the start of image loads on newly displayed cards.

## Changes

- Keep the validated result alongside its shared promise and expose a synchronous lookup for first render. Keys still preserve the application path and strip query strings and fragments.
- Increase the bounded in-memory cache to 512 entries. Successful results expire in 10 minutes; failures retry after 5 seconds. Force refresh still replaces the discovery request. This cache does not persist bookmark metadata in browser storage.
- Allow successful public-image responses to use a private browser cache for one hour, varying by the Home Lab cookie. KV caching remains unchanged. All network requests still authenticate; errors, configuration and discovery responses retain `no-store`. Protected remote images still use anonymous-only fallback.
- Start mounted card image loads eagerly and decode asynchronously. This can increase initial requests when many cards are rendered together; it does not prefetch every unvisited category.

## Validation and limits

- 18 Vitest checks: category remount uses the discovered image on first render with only one discovery request across both mounts; 100 sites share concurrent requests and retain the earliest result; expiry, application-path isolation, query removal, transient retries, slow metadata reads, editor preservation and anonymous fallback pass.
- 48 Node checks: image response caching, unauthenticated rejection and `no-store` errors, icon discovery validation, brand matching and cloud feature regressions pass.
- Production build and whitespace checks pass.

These are request-count and behavior regressions, not measured production network timings. First visits still depend on the source website and network. Browser cache reuse also depends on browser settings and developer-tools cache disabling. No live browser performance measurement has been made for this branch.
