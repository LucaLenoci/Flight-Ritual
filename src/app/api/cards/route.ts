import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "../../../infrastructure/composition-root";
import { serializeCardAlbum } from "../_lib/serializers";
import { withSession } from "../_lib/with-session";

export async function GET(request: NextRequest) {
  return withSession(request, async (userId) => {
    const { getUserCardAlbum } = getContainer();
    const album = await getUserCardAlbum.execute(userId);
    return NextResponse.json(serializeCardAlbum(album));
  });
}
