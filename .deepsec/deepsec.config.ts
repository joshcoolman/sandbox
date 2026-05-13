import { defineConfig } from "deepsec/config";

export default defineConfig({
  projects: [
    { id: "sandbox", root: ".." },
    // <deepsec:projects-insert-above>
  ],
});
