import { config as buildConfig } from "./build";

const port = process.env.PORT || 3000;

async function serveTS(filename: string): Promise<Response> {}

try {
  Bun.serve({
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);
      switch (url.pathname) {
        case "/":
          return new Response(Bun.file("demo/index.html"));
        case "/bundle":
          const build = await Bun.build(buildConfig);
          return new Response(build.outputs[0]);
        default:
          return new Response("404!", { status: 404 });
      }
    },
    port,
  });
  console.log("Server started at http://localhost:3000/");
} catch (e: any) {
  if ("code" in e && e.code === "EADDRINUSE") {
    console.log(
      `Port ${port} already in use. Try setting $PORT to another value.`,
    );
    process.exit(1);
  }
  throw e;
}
