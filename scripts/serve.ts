import { demoConfig } from "./build";

const port = process.env.PORT || 3000;

try {
  Bun.serve({
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);
      switch (url.pathname) {
        case "/":
          return new Response(Bun.file("demo/index.html"));
        case "/bundle":
          const build = await Bun.build(demoConfig);
          return new Response(build.outputs[0]);
        default:
          const f = Bun.file("demo" + url.pathname);
          return (await f.exists())
            ? new Response(f)
            : new Response("404!", { status: 404 });
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
