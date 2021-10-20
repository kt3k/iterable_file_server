import { serve } from "./mod.ts";

async function* gen() {
  yield new File(["custom 404"], "/404");
}

console.log("Starting the server");
const { addr } = serve(gen(), { port: 3032 });

if (addr.transport === "tcp") {
  console.log(`Server started at ${addr.hostname}:${addr.port}`);
}
