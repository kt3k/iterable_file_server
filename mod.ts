import { getMediaType } from "./media_types.ts";
type Server = {
  close(): void;
  addr: Deno.Addr;
};
type ServeOptions = {
  port?: number;
  onError?: (e: Error) => void;
  debugPagePath?: string;
};

// TODO(kt3k): Replace this type with native DOM File type
// when https://github.com/denoland/deno/pull/10459 is merged and released
type File = Blob & { name: string };
/**
 * @private
 */
export type Cache = Record<string, File>;

/**
 * Serves the items from the async iterable of the files matching by its file name.
 *
 * ex.
 * If file.name === "foo.txt", it's served at url "http://localhost:3000/foo.txt".
 * If file.name === "foo/bar.html", it's served at url "http://localhost:3000/foo/bar.html".
 */
export function serve(
  src: AsyncIterable<File>,
  { port = 3000, onError = console.error, debugPagePath = "/__debug__" }:
    ServeOptions = {},
): Server {
  const listener = Deno.listen({ port });
  const cache = {} as Cache;

  accumulate(src, cache).catch(onError);
  const closer = serveFromCache(listener, cache, { onError, debugPagePath });

  return {
    addr: listener.addr,
    close() {
      closer();
      listener.close();
    },
  };
}

/**
 * @private
 * Accumulates the files from the async iterable into the cache record.
 */
export async function accumulate(
  src: AsyncIterable<File>,
  cache: Cache,
): Promise<void> {
  for await (const file of src) {
    const { pathname } = new URL(file.name, "file:///");
    cache[pathname] = file;
  }
}

/**
 * @private
 * Serves the items from the cache record of files.
 */
export function serveFromCache(
  listener: Deno.Listener,
  cache: Cache,
  { onError, debugPagePath }: ServeOptions,
): () => void {
  const httpConns = [] as Deno.HttpConn[];
  const closer = () => {
    for (const conn of httpConns) {
      conn.close();
    }
  };
  if (!debugPagePath) {
    throw new Error("debugPagePath option is not given");
  }
  if (!debugPagePath.startsWith("/")) {
    throw new Error("debugPagePath option doesn't start with '/'");
  }
  (async () => {
    for await (const conn of listener) {
      (async () => {
        const httpConn = Deno.serveHttp(conn);
        httpConns.push(httpConn);
        for await (const { request, respondWith } of httpConn) {
          const { pathname } = new URL(request.url);

          if (pathname === debugPagePath) {
            respondWith(responseDebugPage(cache));
            continue;
          }

          let resp = cache[pathname];
          if (resp) {
            respondWith(
              new Response(resp, {
                headers: {
                  "content-type": getMediaType(
                    pathname.match(/\.[a-zA-Z0-9]+$/)?.[0],
                  ),
                },
              }),
            );
            continue;
          }
          if (pathname.endsWith("/")) {
            resp = cache[pathname + "index.html"];
            if (resp) {
              respondWith(new Response(resp, {
                headers: {
                  "content-type": "text/html",
                }
              }));
              continue;
            }
          }
          // If there's a file at the path /404, it works as the custom 404 page.
          resp = cache["/404"];
          if (resp) {
            respondWith(new Response(resp));
            continue;
          }
          respondWith(responseNotFound(debugPagePath));
        }
      })().catch(onError);
    }
  })().catch(onError);
  return closer;
}

/**
 * Returns a response for the debug page.
 */
function responseDebugPage(cache: Cache): Response {
  return new Response(
    `
      <pre>
debug page
${Object.keys(cache).map((path) => `<a href="${path}">${path}</a>`).join("\n")}
      </pre>
    `,
    {
      status: 200,
      headers: {
        "content-type": "text/html",
      },
    },
  );
}

/**
 * Returns a response for the 404 page.
 */
function responseNotFound(debugPagePath: string): Response {
  return new Response(
    `
      <h1>404 Not Found</h1>
      <p><a href="${debugPagePath}">Go to debug page</a></p>
    `,
    { status: 404, headers: { "content-type": "text/html" } },
  );
}
