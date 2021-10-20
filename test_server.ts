import { serve } from "./mod.ts";

async function* gen() {
  yield new File(["foo"], "foo.txt");
  yield new File(["bar"], "foo/bar.html");
  yield new File(["baz"], "foo/bar/baz.txt");

  yield new File(["index"], "index.html");
  yield new File(["foo/index"], "foo/index.html");
}

console.log("Starting the server");
const { addr } = serve(gen(), { port: 3030 });

if (addr.transport === "tcp") {
  console.log(`Server started at ${addr.hostname}:${addr.port}`);
}
