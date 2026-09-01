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


function showMessage(
  text,
  type = "error"
) {

  message.textContent =
    text;

  message.className =
    `message ${type}`;

}


function hideMessage() {

  message.className =
    "message hidden";

}


function setLoading(loading) {

  searchButton.disabled =
    loading;


  if (loading) {

    buttonText.textContent =
      "Searching...";

    loader.classList.remove(
      "hidden"
    );

  } else {

    buttonText.textContent =
      "Search Result";

    loader.classList.add(
      "hidden"
    );

  }

}


/* ==========================
   FORM SUBMIT
========================== */

form.addEventListener(
  "submit",

  async function(event) {

    event.preventDefault();

    hideMessage();

    resultSection.classList.add(
      "hidden"
    );


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


    if (
      !roll ||
      !registration ||
      !year
    ) {

      showMessage(
        "Please enter all required information."
      );

      return;

    }


    setLoading(true);


    try {

      const response =
        await fetch(
          API_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                exm_code: exam,
                roll: roll,
                reg: registration,
                exm_year: year
              })
          }
        );


      const data =
        await response.json();


      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.error ||
          "Unable to retrieve result."
        );

      }


      displayOfficialResult(
        data.html
      );


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


/* ==========================
   DISPLAY OFFICIAL RESULT
========================== */

function displayOfficialResult(html) {

  /*
    Parse official NU HTML
  */

  const parser =
    new DOMParser();

  const doc =
    parser.parseFromString(
      html,
      "text/html"
    );


  /*
    Find Student Basic Info table
  */

  const tables =
    doc.querySelectorAll(
      "table"
    );


  let resultHTML = "";

  let started = false;


  tables.forEach(function(table) {

    const text =
      table.innerText ||
      "";


    /*
      Start from Student Basic Info
    */

    if (
      text.includes(
        "Student Basic Info"
      )
    ) {

      started = true;

    }


    /*
      Collect official tables
    */

    if (started) {

      resultHTML +=
        table.outerHTML;

    }


    /*
      Stop before later search form
    */

    if (
      text.includes(
        "Controller of Examinations"
      )
    ) {

      started = false;

    }

  });


  /*
    Fallback
  */

  if (!resultHTML) {

    const content =
      doc.querySelector(
        "#contentarea"
      );


    if (content) {

      resultHTML =
        content.innerHTML;

    } else {

      resultHTML =
        html;

    }

  }


  /*
    Display official result
  */

  document
    .getElementById(
      "officialResult"
    )
    .innerHTML =
      resultHTML;


  resultSection.classList.remove(
    "hidden"
  );


  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}
