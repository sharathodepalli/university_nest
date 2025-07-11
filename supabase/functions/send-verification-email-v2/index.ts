// @ts-ignore: Deno imports are handled by Deno runtime
import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
// @ts-ignore: Deno imports are handled by Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
// @ts-ignore: Deno imports are handled by Deno runtime
import { Resend } from "https://esm.sh/resend@1.1.0";

// @ts-ignore: Deno is available in Deno runtime
declare const Deno: any;

console.log("Send verification email Edge Function started!");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      headers: { "Content-Type": "application/json" },
      status: 405,
    });
  }

  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

  try {
    const { email, verificationToken, studentName, userId } = await req.json(); // Added userId to payload

    if (!email || !verificationToken || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing email, verificationToken, or userId" }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize Supabase client with service_role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // FIX: Insert the verification token record into the database from the Edge Function
    // This resolves the 403 Forbidden error on the client side during insertion.
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    const { data: tokenRecord, error: dbError } = await supabaseAdmin
      .from("email_verification_tokens")
      .insert({
        user_id: userId,
        email: email.toLowerCase().trim(),
        token_hash: verificationToken, // Store the token here for verification later
        expires_at: expiresAt.toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error inserting verification token:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to create verification token record" }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Send the email using Resend
    const { data, error: resendError } = await resend.emails.send({
      from: "UniNest <onboarding@resend.dev>",
      to: email,
      subject: "Verify Your UniNest Student Email",
      html: `
        <h1>Hello ${studentName || "Student"},</h1>
        <p>Thank you for registering with UniNest. Please verify your student email by clicking the link below:</p>
        <p><a href="${Deno.env.get("VERIFICATION_REDIRECT_URL")}?token=${verificationToken}">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    if (resendError) {
      console.error("Resend email error:", resendError);
      // It's important to update the token status if email sending fails.
      await supabaseAdmin
        .from("email_verification_tokens")
        .update({ status: "failed" })
        .eq("id", tokenRecord.id); // Use the ID of the record we just inserted.

      return new Response(
        JSON.stringify({ error: "Failed to send verification email" }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Verification email sent:", data);
    return new Response(
      JSON.stringify({ message: "Verification email sent successfully" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in Edge Function:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});