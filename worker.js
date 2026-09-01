const ALLOWED_ORIGIN = "https://skhassandx.github.io";

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";

  return {
    "Access-Control-Allow-Origin":
      origin === ALLOWED_ORIGIN
        ? ALLOWED_ORIGIN
        : ALLOWED_ORIGIN,

    "Access-Control-Allow-Methods":
      "POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type",

    "Access-Control-Max-Age":
      "86400",

    "Vary":
      "Origin"
  };
}


function jsonResponse(request, data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        ...corsHeaders(request),

        "Content-Type":
          "application/json; charset=UTF-8"
      }
    }
  );
}


export default {

  async fetch(request) {

    /*
    =========================
    CORS PREFLIGHT
    =========================
    */

    if (request.method === "OPTIONS") {

      return new Response(
        null,
        {
          status: 204,

          headers:
            corsHeaders(request)
        }
      );

    }


    /*
    =========================
    ONLY POST
    =========================
    */

    if (request.method !== "POST") {

      return jsonResponse(
        request,
        {
          success: false,
          error: "Method not allowed. Use POST."
        },
        405
      );

    }


    try {

      /*
      =========================
      GET JSON DATA
      =========================
      */

      const body =
        await request.json();


      const exm_code =
        String(
          body.exm_code || ""
        ).trim();


      const roll =
        String(
          body.roll || ""
        ).trim();


      const reg =
        String(
          body.reg || ""
        ).trim();


      const exm_year =
        String(
          body.exm_year || ""
        ).trim();



      /*
      =========================
      VALIDATION
      =========================
      */

      if (
        !exm_code ||
        !roll ||
        !reg ||
        !exm_year
      ) {

        return jsonResponse(
          request,
          {
            success: false,
            error:
              "Roll, Registration, Exam Code and Year are required."
          },
          400
        );

      }


      if (
        !/^\d+$/.test(roll)
      ) {

        return jsonResponse(
          request,
          {
            success: false,
            error: "Invalid Roll Number."
          },
          400
        );

      }


      if (
        !/^\d+$/.test(reg)
      ) {

        return jsonResponse(
          request,
          {
            success: false,
            error: "Invalid Registration Number."
          },
          400
        );

      }


      if (
        !/^\d{4}$/.test(exm_year)
      ) {

        return jsonResponse(
          request,
          {
            success: false,
            error: "Invalid Exam Year."
          },
          400
        );

      }


      /*
      =========================
      CREATE NU FORM DATA
      =========================
      */

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


      /*
      =========================
      REQUEST NU RESULT SERVER
      =========================
      */

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


      const html =
        await nuResponse.text();


      /*
      =========================
      NU SERVER ERROR
      =========================
      */

      if (!nuResponse.ok) {

        return jsonResponse(
          request,
          {
            success: false,
            error:
              "NU result server is currently unavailable."
          },
          502
        );

      }


      /*
      =========================
      PARSE RESULT
      =========================
      */

      const result =
        parseNUResult(html);


      if (!result) {

        return jsonResponse(
          request,
          {
            success: false,
            error:
              "Result not found. Please check your Roll, Registration and Exam Year."
          },
          404
        );

      }


      /*
      =========================
      SUCCESS
      =========================
      */

      return jsonResponse(
        request,
        {
          success: true,
          ...result
        },
        200
      );


    } catch (error) {

      return jsonResponse(
        request,
        {
          success: false,
          error:
            error.message ||
            "Server error while checking result."
        },
        500
      );

    }

  }

};



/*
================================
PARSE NU RESULT HTML
================================
*/

function parseNUResult(html) {

  if (
    !html.includes(
      "Student Basic Info"
    )
  ) {

    return null;

  }


  /*
  EXAM TITLE
  */

  const examMatch =
    html.match(
      /Bachelor Degree[\s\S]*?Examination\s+\d{4}/i
    );


  const examTitle =
    examMatch
      ? cleanText(examMatch[0])
      : "National University Result";


  /*
  STUDENT INFORMATION
  */

  const student = {

    name:
      extractValue(
        html,
        "Name"
      ),

    father:
      extractValue(
        html,
        "Father's Name"
      ),

    mother:
      extractValue(
        html,
        "Mother's Name"
      ),

    roll:
      extractValue(
        html,
        "Roll"
      ),

    registration:
      extractValue(
        html,
        "Registration"
      ),

    examYear:
      extractValue(
        html,
        "Exam Year"
      )

  };


  /*
  COURSE RESULT
  */

  const results =
    [];


  const gradeRegex =
    /<tr[^>]*align=["']center["'][^>]*>[\s\S]*?<td[^>]*>\s*(\d{5,})\s*<\/td>[\s\S]*?<td[^>]*>\s*([^<]+?)\s*<\/td>[\s\S]*?<\/tr>/gi;


  let match;


  while (
    (
      match =
        gradeRegex.exec(html)
    )
    !== null
  ) {

    const courseCode =
      cleanText(match[1]);


    const grade =
      cleanText(match[2]);


    if (
      courseCode &&
      grade
    ) {

      results.push(
        {
          courseCode,
          grade
        }
      );

    }

  }


  /*
  VALIDATE
  */

  if (
    !student.name ||
    results.length === 0
  ) {

    return null;

  }


  return {

    examTitle,

    student,

    results

  };

}



/*
================================
EXTRACT STUDENT INFO
================================
*/

function extractValue(
  html,
  label
) {

  const escapedLabel =
    label.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );


  const regex =
    new RegExp(

      "<td[^>]*>" +

      "\\s*(?:<strong>)?\\s*" +

      escapedLabel +

      "\\s*(?:<\\/strong>)?\\s*" +

      "<\\/td>" +

      "[\\s\\S]*?" +

      "<td[^>]*>" +

      "([\\s\\S]*?)" +

      "<\\/td>",

      "i"

    );


  const match =
    html.match(regex);


  if (!match) {

    return "";

  }


  return cleanText(
    match[1]
  );

}



/*
================================
CLEAN HTML
================================
*/

function cleanText(text) {

  return String(text)

    .replace(
      /<[^>]*>/g,
      ""
    )

    .replace(
      /&nbsp;/gi,
      " "
    )

    .replace(
      /&amp;/gi,
      "&"
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();

}
