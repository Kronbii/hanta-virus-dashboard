import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  const secret = process.env.REFRESH_SECRET;
  if (!secret) {
    return Response.json(
      { ok: false, error: "REFRESH_SECRET is not configured" },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  revalidateTag("cases", "max");
  revalidateTag("news", "max");

  return Response.json({
    ok: true,
    revalidated: ["cases", "news"],
    at: new Date().toISOString(),
  });
}
