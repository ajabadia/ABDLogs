import { GET as getHandler } from "@ajabadia/ecosystem-widgets/api/spaces";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return getHandler(request as any);
}
