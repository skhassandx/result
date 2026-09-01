const ALLOWED_ORIGIN = "https://skhassandx.github.io";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=UTF-8"
    }
  });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          error: "Method not allowed. Use POST."
        },
        405
      );
    }

    try {
      const body = await request.json();

      const exm_code = String(body.exm_code || "").trim();
      const roll = String(body.roll || "").trim();
      const reg = String(body.reg || "").trim();
      const exm_year = String(body.exm_year || "").trim();

      if (!exm_code || !roll || !reg || !exm_year) {
        return jsonResponse(
          {
            success: false,
            error: "সব তথ্য পূরণ করুন।"
          },
          400
        );
      }

      if (!/^\d+$/.test(roll)) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid Roll Number."
          },
          400
        );
      }

      if (!/^\d+$/.test(reg)) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid Registration Number."
          },
          400
        );
      }

      if (!/^\d{4}$/.test(exm_year)) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid Exam Year."
          },
          400
        );
      }

      const formData = new URLSearchParams();

      formData.append("csrf_token", "");
      formData.append("exm_code", exm_code);
      formData.append("roll", roll);
      formData.append("reg", reg);
      formData.append("exm_year", exm_year);
      formData.append("code", "");
      formData.append("submit", "Search Result");

      const nuResponse = await fetch(
        "https://result.nu.ac.bd/",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",

            "Accept":
              "text/html,application/xhtml+xml"
          },

          body: formData.toString()
        }
      );

      if (!nuResponse.ok) {
        return jsonResponse(
          {
            success: false,
            error: "NU result server is currently unavailable."
          },
          502
        );
      }

      const html = await nuResponse.text();

      const result = parseNUResult(html);

      if (!result) {
        return jsonResponse(
          {
            success: false,
            error:
              "Result not found. Please check your Roll, Registration and Exam Year."
          },
          404
        );
      }

      return jsonResponse(
        {
          success: true,
          ...result
        },
        200
      );

    } catch (error) {
      return jsonResponse(
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


/* ================================
   NU RESULT PARSER
================================ */

function parseNUResult(html) {

  if (!html.includes("Student Basic Info")) {
    return null;
  }

  const examMatch = html.match(
    /Bachelor Degree[\s\S]*?Examination\s+\d{4}/i
  );

  const examTitle = examMatch
    ? cleanText(examMatch[0])
    : "National University Result";


  const student = {
    name: extractValue(html, "Name"),
    father: extractValue(html, "Father's Name"),
    mother: extractValue(html, "Mother's Name"),
    roll: extractValue(html, "Roll"),
    registration: extractValue(html, "Registration"),
    examYear: extractValue(html, "Exam Year")
  };


  const results = [];

  const gradeRegex =
    /<tr[^>]*align=["']center["'][^>]*>[\s\S]*?<td[^>]*>\s*(\d{5,})\s*<\/td>[\s\S]*?<td[^>]*>\s*([^<]+?)\s*<\/td>[\s\S]*?<\/tr>/gi;

  let match;

  while ((match = gradeRegex.exec(html)) !== null) {

    const courseCode = cleanText(match[1]);
    const grade = cleanText(match[2]);

    if (courseCode && grade) {

      results.push({
        courseCode,
        grade,
        gradePoint: getGradePoint(grade)
      });

    }
  }


  if (!student.name || results.length === 0) {
    return null;
  }


  /* ================================
     GPA CALCULATION
  ================================ */

  let totalGradePoint = 0;
  let totalCourses = 0;
  let failedCourses = 0;

  results.forEach(course => {

    totalGradePoint += course.gradePoint;
    totalCourses++;

    if (course.grade === "F") {
      failedCourses++;
    }

  });


  const gpa =
    totalCourses > 0
      ? totalGradePoint / totalCourses
      : 0;


  return {
    examTitle,

    student,

    results,

    summary: {
      totalCourses,
      failedCourses,
      passedCourses:
        totalCourses - failedCourses,

      gpa:
        Number(gpa.toFixed(2)),

      cgpaAvailable:
        failedCourses === 0
    }
  };
}


/* ================================
   GRADE TO GRADE POINT
================================ */

function getGradePoint(grade) {

  const grades = {

    "A+": 4.00,
    "A": 3.75,
    "A-": 3.50,

    "B+": 3.25,
    "B": 3.00,
    "B-": 2.75,

    "C+": 2.50,
    "C": 2.25,
    "D": 2.00,

    "F": 0.00
  };

  return grades[grade] ?? 0.00;
}


/* ================================
   EXTRACT STUDENT INFO
================================ */

function extractValue(html, label) {

  const escapedLabel = label.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(
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

  const match = html.match(regex);

  if (!match) {
    return "";
  }

  return cleanText(match[1]);
}


/* ================================
   CLEAN HTML
================================ */

function cleanText(text) {
  return String(text)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}
