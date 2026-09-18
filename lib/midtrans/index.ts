import crypto from "crypto";

export function midtransBaseUrl() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

export function midtransApiUrl() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
}

export function verifyMidtransSignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const expected = crypto.createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureKey));
}