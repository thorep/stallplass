# Image Optimization with Vercel

Image Optimization is available on [all plans](/docs/plans)

Vercel supports dynamically transforming unoptimized images to reduce the file system while maintaining high quality. These optimized images are cached on the [Vercel Edge Network](/docs/edge-network), meaning they're available close to users whenever they're requested.

## [Get started](#get-started)

Image Optimization works with many frameworks, including Next.js, Astro, and Nuxt, enabling you to optimize images using built-in components.

*   Get started with Next.js by following the [Image Optimization Quickstart](/docs/image-optimization/quickstart) and selecting Next.js from the dropdown.
*   Get started with Nuxt by following the [Image Optimization Quickstart](/docs/image-optimization/quickstart) and selecting Nuxt from the dropdown.
*   Get started with Astro by following the [Image Optimization Quickstart](/docs/image-optimization/quickstart) and selecting Astro from the dropdown.
*   For a live example which demonstrates usage with the [`next/image`](https://nextjs.org/docs/pages/api-reference/components/image) component, see the [Image Optimization demo](https://image-component.nextjs.gallery/).

## [Why should I optimize my images on Vercel?](#why-should-i-optimize-my-images-on-vercel)

Optimizing images on Vercel provides several advantages for your application:

*   Reduces the size of images and data transferred, enhancing website performance, user experience, and [Fast Data Transfer](/docs/edge-network/manage-usage#fast-data-transfer) usage.
*   Improving [Core Web Vitals](https://web.dev/vitals/), reduced bounce rates, and speeding up page loads.
*   Sizing images to support different devices and use modern formats like [WebP](https://developer.mozilla.org/docs/Web/Media/Formats/Image_types#webp_image) and [AVIF](https://developer.mozilla.org/docs/Web/Media/Formats/Image_types#avif_image).
*   Optimized images are cached after transformation, which allows them to be reused in subsequent requests.

## [How Image Optimization works](#how-image-optimization-works)

The flow of image optimization on Vercel involves several steps, starting from the image request to serving the optimized image.

1.  The optimization process starts with your component choice in your codebase:
    
    *   If you use a standard HTML `img` element, the browser will be instructed to bypass optimization and serve the image directly from its source.
    *   If you use a framework's `Image` component (like [`next/image`](https://nextjs.org/docs/app/api-reference/components/image)) it will use Vercel's image optimization pipeline, allowing your images to be automatically optimized and cached.
2.  When Next.js receives an image request, it checks the [`unoptimized`](https://nextjs.org/docs/app/api-reference/components/image#unoptimized) prop on the `Image` component or the configuration in the [`next.config.ts`](https://nextjs.org/docs/app/api-reference/next-config-js) file to determine if optimization is disabled.
    
    *   If you set the `unoptimized` prop on the `Image` component to `true`, Next.js bypasses optimization and serves the image directly from its source.
    *   If you don't set the `unoptimized` prop or set it to `false`, Next.js checks the `next.config.ts` file to see if optimization is disabled. This configuration applies to all images and overrides the individual component prop.
    *   If neither the `unoptimized` prop is set nor optimization is disabled in the `next.config.ts` file, Next.js continues with the optimization process.
3.  If optimization is enabled, Vercel validates the [loader configuration](https://nextjs.org/docs/app/api-reference/components/image#loader) (whether using the default or a custom loader) and verifies that the image [source URL](https://nextjs.org/docs/app/api-reference/components/image#src) matches the allowed patterns defined in your configuration ([`remotePatterns`](/docs/image-optimization#setting-up-remote-patterns) or [`localPatterns`](/docs/image-optimization#setting-up-local-patterns)).
    
4.  Vercel then checks the status of the cache to see if an image has been previously cached:
    

*   `HIT`: The image is fetched and served from the cache, either in region or from the shared global cache.
    *   If fetched from the global cache, it's billed as an [image cache read](/docs/image-optimization/limits-and-pricing#image-cache-reads) which is reflected in your [usage metrics](https://vercel.com/docs/pricing/manage-and-optimize-usage#viewing-usage).
*   `MISS`: The image is fetched, transformed, cached, and then served to the user.
    *   Billed as an [image transformation](/docs/image-optimization/limits-and-pricing#image-transformations) and [image cache write](/docs/image-optimization/limits-and-pricing#image-cache-writes) which is reflected in your [usage metrics](https://vercel.com/docs/pricing/manage-and-optimize-usage#viewing-usage).
*   `STALE`: The image is fetched and served from the cache while revalidating in the background.
    *   Billed as an [image transformation](/docs/image-optimization/limits-and-pricing#image-transformations) and [image cache write](/docs/image-optimization/limits-and-pricing#image-cache-writes) which is reflected in your [usage metrics](https://vercel.com/docs/pricing/manage-and-optimize-usage#viewing-usage).

## [When to use Image Optimization](#when-to-use-image-optimization)

Image Optimization is ideal for:

*   Responsive layouts where images need to be optimized for different device sizes (e.g. mobile vs desktop)
*   Large, high-quality images (e.g. product photos, hero images)
*   User uploaded images
*   Content where images play a central role (e.g. photography portfolios)

In some cases, Image Optimization may not be necessary or beneficial, such as:

*   Small icons or thumbnails (under 10 KB)
*   Animated image formats such as GIFs
*   Vector image formats such as SVG
*   Frequently changing images where caching could lead to outdated content

If your images meet any of the above criteria where Image Optimization is not beneficial, we recommend using the [`unoptimized`](https://nextjs.org/docs/app/api-reference/components/image#unoptimized) prop on the Next.js `Image` component. For guidance on [SvelteKit](https://svelte.dev/docs/kit/adapter-vercel#Image-Optimization), [Astro](https://docs.astro.build/en/guides/images/#authorizing-remote-images), or [Nuxt](https://image.nuxt.com/providers/vercel), see their documentation.

It's important that you are only optimizing images that need to be optimized otherwise you could end up using your [image usage](/docs/image-optimization/limits-and-pricing) quota unnecessarily. For example, if you have a small icon or thumbnail that is under 10 KB, you should not use Image Optimization as these images are already very small and optimizing them further would not provide any benefits.

## [Setting up remote or local patterns](#setting-up-remote-or-local-patterns)

An important aspect of using the `Image` component is properly setting up remote/local patterns in your `next.config.ts` file. This configuration determines which images are allowed to be optimized.

You can set up patterns for both [local images](#local-images) (stored as static assets in your `public` folder) and [remote images](#remote-images) (stored externally). In both cases you specify the pathname the images are located at.

### [Local images](#local-images)

A local image is imported from your file system and analyzed at build time. The import is added to the `src` prop: `src={myImage}`

#### [Setting up local patterns](#setting-up-local-patterns)

To set up local patterns, you need to specify the pathname of the images you want to optimize. This is done in the `next.config.ts` file:

```
module.exports = {
  images: {
    localPatterns: [
      {
        pathname: '/assets/images/**',
        search: '',
      },
    ],
  },
};
```

See the [Next.js documentation for local patterns](https://nextjs.org/docs/app/api-reference/components/image#localpatterns) for more information.

#### [Local images cache key](#local-images-cache-key)

The cache key for local images is based on the query string parameters, the `Accept` HTTP header, and the content hash of the image URL.

*   Cache Key:
    *   Project ID
    *   Query string parameters:
        *   `q`: The quality of the optimized image, between 1 (lowest quality) and 100 (highest quality).
        *   `w`: The width (in pixels) of the optimized image.
        *   `url`: The URL of the optimized image is keyed by content hash e.g. `/assets/me.png` is converted to `3399d02f49253deb9f5b5d1159292099`.
    *   `Accept` HTTP header (normalized).
*   Local image cache invalidation:
    *   Redeploying your app doesn't invalidate the image cache.
    *   To invalidate, replace the image of the same name with different content, then [redeploy](/docs/deployments/managing-deployments#redeploy-a-project).
*   Local image cache expiration:
    *   [Cached](/docs/edge-network/caching#static-files-caching) for up to 31 days on the Vercel Edge Network.

### [Remote images](#remote-images)

A remote image requires the `src` property to be a URL string, which can be relative or absolute.

#### [Setting up remote patterns](#setting-up-remote-patterns)

To set up remote patterns, you need to specify the `hostname` of the images you want to optimize. This is done in the `next.config.ts` file:

```
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/account123/**',
        search: '',
      },
    ],
  },
};
```

In the case of external images, you should consider adding your account id to the `pathname` if you don't own the `hostname`. For example `pathname: '/account123/v12h2bv/**'`. This helps protect your source images from potential abuse.

See the [Next.js documentation for remote patterns](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns) for more information.

#### [Remote images cache key](#remote-images-cache-key)

The cache key for remote images is based on the query string parameters, the `Accept` HTTP header, and the content hash of the image URL.

*   Cache Key:
    *   Project ID
    *   Query string parameters:
        *   `q`: The quality of the optimized image, between 1 (lowest quality) and 100 (highest quality).
        *   `w`: The width (in pixels) of the optimized image.
        *   `url`: The URL of the optimized image e.g. [https://example.com/assets/me.png](https://example.com/assets/me.png).
    *   `Accept` HTTP header (normalized).
*   Remote image cache invalidation:
    *   Redeploying your app doesn't invalidate the image cache
    *   To invalidate, add a query string to the `src` property (e.g., `?v=2`), then [redeploy](/docs/deployments/managing-deployments#redeploy-a-project).
    *   Alternatively, you can configure the cache to expire more frequently.
*   Remote image cache expiration:
    *   TTL is determined by the [`Cache-Control`](/docs/headers#cache-control-header) `max-age` header from the upstream image or [`minimumCacheTTL`](https://nextjs.org/docs/api-reference/next/image#minimum-cache-ttl) config (default: `60` seconds), whichever is larger.
    *   If your image content changes frequently, it's best to keep this TTL short.

Once an image is cached, it remains so even if you update the source image. For remote images, users accessing a URL with a previously cached image will see the old version until the cache expires or the image is invalidated. Each time an image is requested, it counts towards your [Fast Data Transfer](/docs/edge-network/manage-usage#fast-data-transfer) and [Edge Request](/docs/edge-network/manage-usage#edge-requests) usage for your billing cycle.

See [Pricing](/docs/image-optimization/limits-and-pricing) for more information, and read more about [caching behavior](https://nextjs.org/docs/app/api-reference/components/image#caching-behavior) in the Next.js documentation.

## [Image Transformation URL format](#image-transformation-url-format)

When you use the `Image` component in common frameworks and deploy your project on Vercel, Image Optimization automatically adjusts your images for different device screen sizes. The `src` prop you provided in your code is dynamically replaced with an optimized image URL. For example:

*   Next.js: `/_next/image?url={link/to/src/image}&w=3840&q=75`
*   Nuxt.js, Astro, etc: `/_vercel/image?url={link/to/src/image}&w=3840&q=75`

The Image Optimization API has the following query parameters:

*   `url`: The URL of the source image to be transformed. This can be a local image (relative url) or remote image (absolute url).
*   `w`: The width of the transformed image in pixels. No height is needed since the source image aspect ratio is preserved.
*   `q`: The quality of the transformed image, between 1 (lowest quality) and 100 (highest quality).

The allowed values of those query parameters are determined by the framework you are using, such as `next.config.js` for Next.js.

If you are not using a framework that comes with an `Image` component or you are building your own framework, refer to the [Build Output API](/docs/build-output-api/configuration#images) to see how the build output from a framework can configure the Image Optimization API.

## [Opt-in](#opt-in)

To switch to the transformation images-based pricing plan:

1.  Choose your team scope on the dashboard, and go to Settings, then Billing
2.  Scroll down to the Image Optimization section
3.  Select Review Cost Estimate. Proceed to enable this option in the dialog that shows the cost estimate.

[View your estimate](https://vercel.com/d?to=%2F%5Bteam%5D%2F~%2Fsettings%2Fbilling%23image-optimization-new-price&title=Go+to+Billing+Settings)

## [Related](#related)

For more information on what to do next, we recommend the following articles:

*   [Image Optimization quickstart](/docs/image-optimization/quickstart)
*   [Managing costs](/docs/image-optimization/managing-image-optimization-costs)
*   [Pricing](/docs/image-optimization/limits-and-pricing)
*   If you are building a custom web framework, you can also use the [Build Output API](/docs/build-output-api/v3/configuration#images) to implement Image Optimization. To learn how to do this, see the [Build your own web framework](/blog/build-your-own-web-framework#automatic-image-optimization) blog post.

Last updated on July 24, 2025