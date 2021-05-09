import { serve } from "./mod.ts";

async function* gen() {
}

console.log("Starting the server");
const { addr } = serve(gen(), { port: 3031, debugPagePath: "/__mypath__" });

if (addr.transport === "tcp") {
  console.log(`Server started at ${addr.hostname}:${addr.port}`);
}
