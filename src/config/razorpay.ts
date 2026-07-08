import Razorpay from "razorpay";
import { env } from "./env";

export const razorpayClient = new Razorpay({
  key_id: env.razorpay.keyId || "rzp_test_dummy",
  key_secret: env.razorpay.keySecret || "dummy_secret",
});
