type Server = {
  close(): void;
  addr: Deno.Addr;
};
type ServeOptions = {
  port?: number;
  onError?: (e: Error) => void;
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
  { port = 3000, onError = console.error }: ServeOptions = {},
): Server {
  const listener = Deno.listen({ port });
  const cache = {} as Cache;

  accumulate(src, cache).catch(onError);
  const closer = serveFromCache(listener, cache, { onError });

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
  { onError }: ServeOptions,
): () => void {
  const httpConns = [] as Deno.HttpConn[];
  const closer = () => {
    for (const conn of httpConns) {
      conn.close();
    }
  };
  (async () => {
    for await (const conn of listener) {
      (async () => {
        const httpConn = Deno.serveHttp(conn);
        httpConns.push(httpConn);
        for await (const { request, respondWith } of httpConn) {
          const { pathname } = new URL(request.url);

          if (pathname === "/__debug__") {
            respondWith(responseDebugPage(cache));
            continue;
          }

          let resp = cache[pathname];
          if (resp) {
            respondWith(new Response(resp));
            continue;
          }
          if (pathname.endsWith("/")) {
            resp = cache[pathname + "index.html"];
            if (resp) {
              respondWith(new Response(resp));
              continue;
            }
          }
          respondWith(responseNotFound());
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
  return new Response("debug page: " + Object.keys(cache).toString());
}

/**
 * Returns a response for the 404 page.
 */
function responseNotFound(): Response {
  return new Response(`404 Not Found`, { status: 404 });
}
