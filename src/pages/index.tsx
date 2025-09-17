import Head from "next/head";
import Board from "@/components/board";

export default function Home() {
  return (
    <>
      <Head>
        <title>2048Wars!</title>
        <meta name="description" content="2048Wars!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Board />
      </main>
    </>
  );
}
