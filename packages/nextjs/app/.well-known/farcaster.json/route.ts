function withValidProperties(properties: Record<string, undefined | string | string[]>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    }),
  );
}

export async function GET() {
  const URL = "https://2048-wars.vercel.app";

  return Response.json({
    accountAssociation: {
      header:
        "eyJmaWQiOjQxNDU3MCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDlERDNmNDk2YTAyOGQxQTVFMzFmMjM5MTNGMzdCZjQ2QUMxQjY0QTcifQ",
      payload: "eyJkb21haW4iOiIyMDQ4LXdhcnMudmVyY2VsLmFwcCJ9",
      signature:
        "MHg3Yzc1MGNhMjdlZGZlZjhhM2M3N2M2OWY2YjgwZmM3YWYwMzg0ZjhlYzQxOWU2M2VmYTZhYjY4ZTgzMTQ4MTI2MWFjOWY4OWU4ZGM5OTc5MTJkNjY3NjI4MmEwODUyZjllNWI3NWNiNzFmZjE2MTQ1MzUzZmQyNWJiZGIzM2JlZjFj",
    },
    frame: withValidProperties({
      version: "1",
      name: "2048Wars!",
      subtitle: "2048wars",
      description: "Reach 2048 and compete on the leaderboard to win rewards",
      screenshotUrls: [],
      iconUrl: `${URL}/2048Wars-Logo.png`,
      splashImageUrl: `${URL}/2048Wars-Logo.png`,
      splashBackgroundColor: "#6200ea",
      homeUrl: URL,
      webhookUrl: `${URL}/api/webhook`,
      primaryCategory: "games",
      tags: [],
      heroImageUrl: `${URL}/thumbnail.jpg`,
      tagline: "Strategic 2048 with rewards",
      ogTitle: "2048Wars!",
      ogDescription: "Reach 2048, win rewards",
      ogImageUrl: `${URL}/thumbnail.jpg`,
    }),
  });
}
