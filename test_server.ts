import { serve } from "./mod.ts";

async function* gen() {
  yield Object.assign(new Blob(["foo"]), { name: "foo.txt" });
  yield Object.assign(new Blob(["bar"]), { name: "foo/bar.html" });
  yield Object.assign(new Blob(["baz"]), { name: "foo/bar/baz.txt" });
}

console.log("Starting the server");
const { addr } = serve(gen(), { port: 3030 });

if (addr.transport === "tcp") {
  console.log(`Server started at ${addr.hostname}:${addr.port}`);
}
