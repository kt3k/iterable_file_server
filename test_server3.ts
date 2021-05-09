import { serve } from "./mod.ts";

async function* gen() {
  yield Object.assign(new Blob(["custom 404"]), { name: "/404" });
}

console.log("Starting the server");
const { addr } = serve(gen(), { port: 3032 });

if (addr.transport === "tcp") {
  console.log(`Server started at ${addr.hostname}:${addr.port}`);
}
