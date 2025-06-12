import { NextResponse } from "next/server";

export const _returnError = (error: string | object, exception?: Error | string) => {
  return new NextResponse(JSON.stringify(typeof error == 'object' ? error : {
    error,
    exception: exception ? (exception instanceof Error ? exception.message : exception as string) : undefined,
  }), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
