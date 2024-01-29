const port = process.env.PORT || 3000;

try {
  Bun.serve({
    fetch(_req: Request): Response | Promise<Response> {
      return new Response(Bun.file("index.html"));
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
