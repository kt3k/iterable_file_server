import { getMediaType } from "./media_types.ts";
import {
  assertEquals,
} from "https://deno.land/std@0.103.0/testing/asserts.ts";

Deno.test("getMediaType - known types", () => {
  assertEquals(getMediaType(".txt"), "text/plain");
  assertEquals(getMediaType(".html"), "text/html");
  assertEquals(getMediaType(".js"), "application/javascript");
  assertEquals(getMediaType(".css"), "text/css");
});

Deno.test("getMediaType - unknown types", () => {
  assertEquals(getMediaType(".abc"), "application/octet-stream");
  assertEquals(getMediaType(".foo"), "application/octet-stream");
});

Deno.test("getMediaType - undefined", () => {
  assertEquals(getMediaType(undefined), "application/octet-stream");
});
