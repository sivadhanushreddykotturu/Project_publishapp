import { Resend } from "resend";
import { env } from "./env";

export const resendClient = new Resend(env.resend.apiKey || "re_dummy_key_for_boot");
