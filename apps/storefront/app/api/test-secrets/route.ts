import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/env";

export async function GET() {
  try {
    const env = await loadEnv();
    
    return NextResponse.json({
      success: true,
      count: Object.keys(env).length,
      keys: Object.keys(env),
      env
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error?.message || "Unknown error" 
    }, { status: 500 });
  }
}
