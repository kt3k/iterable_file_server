import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.103.0/testing/asserts.ts";

import { accumulate, Cache } from "./mod.ts";

Deno.test("accumulate - accumulates the file from the iterable", async () => {
  const cache = {} as Cache;
  await accumulate(gen(), cache);
  assertEquals(Object.keys(cache), [
    "/foo.txt",
    "/foo/bar.html",
    "/foo/bar/baz.txt",
  ]);
});

/* TODO(kt3k): Enable this when https://github.com/denoland/deno/issues/10508 is resolved.
Deno.test("serveFromCache - serves items from cache", async () => {
  const cache = {} as Cache;
  await accumulate(gen(), cache);

  const listener = Deno.listen({ port: 3030 });

  await new Promise((resolve) => { setTimeout(resolve, 300); });

  const closer = serveFromCache(listener, cache, {});

  await new Promise((resolve) => { setTimeout(resolve, 300); });

  const resp = await fetch("http://0.0.0.0:3030/foo.txt");
  assertEquals(await resp.text(), "foo");

  await new Promise((resolve) => { setTimeout(resolve, 300); });

  closer();
  listener.close();
  await new Promise((resolve) => { setTimeout(resolve, 300); });
});
*/

Deno.test("serve - serves the given assets", async () => {
  const p = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--allow-net",
      "--unstable",
      "test_server.ts",
    ],
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  let res: Response;
  res = await fetch("http://0.0.0.0:3030/__debug__");
  assertStringIncludes(await res.text(), "debug page");

  res = await fetch("http://0.0.0.0:3030/foo.txt");
  assertEquals(await res.text(), "foo");
  res = await fetch("http://0.0.0.0:3030/foo/bar.html");
  assertEquals(await res.text(), "bar");
  res = await fetch("http://0.0.0.0:3030/foo/bar/baz.txt");
  assertEquals(await res.text(), "baz");

  res = await fetch("http://0.0.0.0:3030/");
  assertEquals(await res.text(), "index");
  res = await fetch("http://0.0.0.0:3030/foo");
  assertStringIncludes(await res.text(), "404 Not Found");
  res = await fetch("http://0.0.0.0:3030/foo/");
  assertEquals(await res.text(), "foo/index");

  res = await fetch("http://0.0.0.0:3030/asdf.txt");
  assertStringIncludes(await res.text(), "404 Not Found");

  Deno.kill(p.pid, "SIGINT");
  p.close();
});

Deno.test("serve - custom debug page path", async () => {
  const p = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--allow-net",
      "--unstable",
      "test_server2.ts",
    ],
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const res = await fetch("http://0.0.0.0:3031/__mypath__");
  assertStringIncludes(await res.text(), "debug page");
  p.close();
});

Deno.test("serve - custom 404 page", async () => {
  const p = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--allow-net",
      "--unstable",
      "test_server3.ts",
    ],
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const res = await fetch("http://0.0.0.0:3032/asdf");
  assertEquals(await res.text(), "custom 404");
  p.close();
});

async function* gen() {
  yield new File(["foo"], "foo.txt");
  yield new File(["bar"], "foo/bar.html");
  yield new File(["baz"], "foo/bar/baz.txt");
}
