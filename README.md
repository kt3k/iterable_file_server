# iterable_file_server v0.1.7

> Serve items from `AsyncIterable<F>`, where `F = Blob & { name: string }`

# Usage

```ts
import { serve } from "https://deno.land/x/iterable_file_server@v0.1.7/mod.ts";

async function* generateItems() {
  yield Object.assign(new Blob(["foo"]), { name: "foo.html" });
  yield Object.assign(new Blob(["bar"]), { name: "foo/bar.html" });
  yield Object.assign(new Blob(["baz"]), { name: "foo/bar/baz.html" });
  // ...
}

const server = serve(generateItems(), { port: 3000 });
// This serves the follwoing paths:
// - http://localhost:3000/foo.html
// - http://localhost:3000/foo/bar.html
// - http://localhost:3000/foo/bar/baz.html
// This also serves the debug page:
// - http://localhost:3000/__debug__

// ...

// When you want to stop the server.
server.close();
```

This depends on native http bindings, so you need `--unstable` flag to use this
module.

# History

- 2021-07-31 v0.1.7 Set `content-type` header #3.

# License

MIT
