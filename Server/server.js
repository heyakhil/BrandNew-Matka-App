import { tsImport } from "tsx/esm/api";

try {
  await tsImport("./src/index.ts", import.meta.url);
} catch (error) {
  console.error("Failed to start Royal Club server:", error);
  process.exitCode = 1;
}
