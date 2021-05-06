# iterable_file_server v0.1.0

> Serve items from `AsyncIterable<F>`, where `F = Blob & { name: string }`

# Usage

```ts
import { serve } from "https://deno.land/x/iterable_file_server@0.1.0/mod.ts

async function* generateItems() {
  // yields items as Blob & { name: string }
}

const server = serve(generateItems(), { port: 8080 });

// ...

// When you want to stop the server.
server.close();
```

This depends on native http bindings, so you need `--unstable` flag to use this
module.

# License

MIT
