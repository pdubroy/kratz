const port = process.env.PORT || 3000;

const transpiler = new Bun.Transpiler();

async function serveTS(filename: string): Promise<Response> {
  const source = await Bun.file(filename).text();
  return new Response(await transpiler.transform(source));
}

try {
  Bun.serve({
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);
      switch (url.pathname) {
        case "/":
          return new Response(Bun.file("demo/index.html"));
        case "/app.ts":
          return serveTS("demo/app.ts");
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
