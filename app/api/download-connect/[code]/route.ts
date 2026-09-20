import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = (rawCode || "").replace(/\D/g, "").slice(0, 6);

  if (code.length !== 6) {
    return NextResponse.json({ message: "Geçersiz destek kodu." }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", "downloads", "HomakConnect.exe");

  let fileBuffer: Buffer;
  try {
    fileBuffer = await readFile(filePath);
  } catch {
    return NextResponse.json(
      { message: "İstemci dosyası şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin." },
      { status: 503 },
    );
  }

  const fileName = `HomakConnect-${code}.exe`;

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(fileBuffer.length),
      "Cache-Control": "no-store",
    },
  });
}
