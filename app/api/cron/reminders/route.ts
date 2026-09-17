import { NextRequest, NextResponse } from "next/server";
import { processReminderRules } from "@/jobs/reminder-worker";
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await processReminderRules();
  return NextResponse.json(result);
}
