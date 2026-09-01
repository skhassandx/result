const API_URL =
  "https://result.hassanalmamun00.workers.dev";


const form =
  document.getElementById("resultForm");

const message =
  document.getElementById("message");

const resultSection =
  document.getElementById("resultSection");

const searchButton =
  document.getElementById("searchButton");

const buttonText =
  document.getElementById("buttonText");

const loader =
  document.getElementById("loader");


function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = `message ${type}`;
}


function hideMessage() {
  message.className = "message hidden";
}


function setLoading(loading) {

  searchButton.disabled = loading;

  if (loading) {

    buttonText.textContent = "Searching...";

    loader.classList.remove("hidden");

  } else {

    buttonText.textContent = "Search Result";

    loader.classList.add("hidden");

  }
}


form.addEventListener(
  "submit",

  async function (event) {

    event.preventDefault();

    hideMessage();

    resultSection.classList.add("hidden");


    const exam =
      document
        .getElementById("exam")
        .value;

    const roll =
      document
        .getElementById("roll")
        .value
        .trim();

    const registration =
      document
        .getElementById("registration")
        .value
        .trim();

    const year =
      document
        .getElementById("year")
        .value
        .trim();


    if (!roll || !registration || !year) {

      showMessage(
        "Please enter Roll, Registration and Exam Year."
      );

      return;
    }


    setLoading(true);


    try {

      const response = await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            exm_code: exam,
            roll: roll,
            reg: registration,
            exm_year: year
          })
        }
      );


      const data =
        await response.json();


      if (!response.ok || !data.success) {

        throw new Error(
          data.error ||
          "Unable to retrieve result."
        );

      }


      displayResult(data);


    } catch (error) {

      showMessage(
        error.message ||
        "Failed to fetch result."
      );

    } finally {

      setLoading(false);

    }

  }
);


/* ================================
   DISPLAY RESULT
================================ */

function displayResult(data) {

  document
    .getElementById("examTitle")
    .textContent =
      data.examTitle ||
      "National University Result";


  /* STUDENT INFORMATION */

  const studentInfo =
    document.getElementById("studentInfo");

  studentInfo.innerHTML = "";


  const student =
    data.student;


  const fields = [

    ["Name", student.name],

    ["Father's Name", student.father],

    ["Mother's Name", student.mother],

    ["Roll", student.roll],

    ["Registration", student.registration],

    ["Exam Year", student.examYear]

  ];


  fields.forEach(function (item) {

    const div =
      document.createElement("div");

    div.className =
      "info-item";


    const label =
      document.createElement("span");

    label.textContent =
      item[0];


    const value =
      document.createElement("strong");

    value.textContent =
      item[1] || "-";


    div.appendChild(label);

    div.appendChild(value);


    studentInfo.appendChild(div);

  });


  /* RESULT TABLE */

  const resultTable =
    document.getElementById("resultTable");

  resultTable.innerHTML = "";


  data.results.forEach(function (result) {

    const row =
      document.createElement("tr");


    const courseCell =
      document.createElement("td");

    courseCell.textContent =
      result.courseCode;


    const gradeCell =
      document.createElement("td");

    gradeCell.textContent =
      result.grade;


    const pointCell =
      document.createElement("td");

    pointCell.textContent =
      Number(result.gradePoint)
        .toFixed(2);


    row.appendChild(courseCell);

    row.appendChild(gradeCell);

    row.appendChild(pointCell);


    resultTable.appendChild(row);

  });


  /* ================================
     GPA / CGPA SUMMARY
  ================================ */

  const summary =
    data.summary;


  document
    .getElementById("totalCourses")
    .textContent =
      summary.totalCourses;


  document
    .getElementById("passedCourses")
    .textContent =
      summary.passedCourses;


  document
    .getElementById("failedCourses")
    .textContent =
      summary.failedCourses;


  document
    .getElementById("fourthYearGPA")
    .textContent =
      Number(summary.gpa)
        .toFixed(2);


  const cgpaElement =
    document.getElementById("cgpa");


  const cgpaStatus =
    document.getElementById("cgpaStatus");


  /*
  শুধুমাত্র 4th year result দিয়ে
  Honours CGPA বের করা যাবে না।
  */

  cgpaElement.textContent =
    "Not Available";


  if (summary.failedCourses > 0) {

    cgpaStatus.textContent =
      `You have failed in ${summary.failedCourses} course(s). Final CGPA will not be available until the failed subjects are cleared.`;

  } else {

    cgpaStatus.textContent =
      "4th Year result is available. Overall Honours CGPA requires results from all academic years.";

  }


  resultSection.classList.remove("hidden");


  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}
