const ALLOWED_ORIGIN = "https://skhassandx.github.io";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

export default {
  async fetch(request) {

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Method not allowed"
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders(),
            "Content-Type": "application/json"
          }
        }
      );
    }

    try {

      const body = await request.json();

      const exm_code =
        String(body.exm_code || "").trim();

      const roll =
        String(body.roll || "").trim();

      const reg =
        String(body.reg || "").trim();

      const exm_year =
        String(body.exm_year || "").trim();


      if (!exm_code || !roll || !reg || !exm_year) {

        return jsonResponse({
          success: false,
          error: "সব তথ্য পূরণ করুন।"
        }, 400);

      }


      // Data exactly as NU result form sends

      const formData =
        new URLSearchParams();

      formData.append(
        "csrf_token",
        ""
      );

      formData.append(
        "exm_code",
        exm_code
      );

      formData.append(
        "roll",
        roll
      );

      formData.append(
        "reg",
        reg
      );

      formData.append(
        "exm_year",
        exm_year
      );

      formData.append(
        "code",
        ""
      );

      formData.append(
        "submit",
        "Search Result"
      );


      // Request NU official server

      const nuResponse =
        await fetch(
          "https://result.nu.ac.bd/",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",

              "Accept":
                "text/html,application/xhtml+xml"
            },

            body:
              formData.toString()
          }
        );


      if (!nuResponse.ok) {

        return jsonResponse({
          success: false,
          error:
            "NU Result Server is currently unavailable."
        }, 502);

      }


      const html =
        await nuResponse.text();


      // Check if result exists

      if (
        !html.includes(
          "Student Basic Info"
        )
      ) {

        return jsonResponse({
          success: false,
          error:
            "Result not found. Please check Roll, Registration and Exam Year."
        }, 404);

      }


      /*
        Send the official HTML response
        to your frontend.

        No Course/Grade parsing here.
      */

      return new Response(
        JSON.stringify({
          success: true,
          html: html
        }),
        {
          status: 200,

          headers: {
            ...corsHeaders(),

            "Content-Type":
              "application/json; charset=UTF-8"
          }
        }
      );


    } catch (error) {

      return jsonResponse({
        success: false,

        error:
          error.message ||
          "Server error while checking result."
      }, 500);

    }

  }
};


function jsonResponse(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        ...corsHeaders(),

        "Content-Type":
          "application/json; charset=UTF-8"
      }
    }
  );

}
