const API_URL = "https://result.hassanalmamun00.workers.dev";

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



function setLoading(
    loading
) {

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



        if (!roll) {

            showMessage(
                "Please enter your Exam Roll."
            );

            return;

        }


        if (!registration) {

            showMessage(
                "Please enter your Registration Number."
            );

            return;

        }


        if (!year) {

            showMessage(
                "Please enter your Exam Year."
            );

            return;

        }



        setLoading(
            true
        );



        try {

            const response =
                await fetch(
                    API_URL,
                    {

                        method:
                            "POST",

                        headers:
                            {
                                "Content-Type":
                                    "application/json"
                            },

                        body:
                            JSON.stringify(
                                {
                                    exm_code:
                                        exam,

                                    roll:
                                        roll,

                                    reg:
                                        registration,

                                    exm_year:
                                        year
                                }
                            )

                    }
                );



            const data =
                await response.json();



            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to retrieve result."
                );

            }



            if (!data.success) {

                throw new Error(
                    data.error ||
                    "Result not found."
                );

            }



            displayResult(
                data
            );


        } catch (error) {

            showMessage(
                error.message ||
                "Something went wrong. Please try again."
            );

        } finally {

            setLoading(
                false
            );

        }

    }
);



function displayResult(
    data
) {

    document
        .getElementById("examTitle")
        .textContent =
            data.examTitle ||
            "National University Result";



    const studentInfo =
        document.getElementById(
            "studentInfo"
        );


    studentInfo.innerHTML =
        "";



    const student =
        data.student;



    const fields =
        [
            [
                "Name",
                student.name
            ],

            [
                "Father's Name",
                student.father
            ],

            [
                "Mother's Name",
                student.mother
            ],

            [
                "Roll",
                student.roll
            ],

            [
                "Registration",
                student.registration
            ],

            [
                "Exam Year",
                student.examYear
            ]
        ];



    fields.forEach(
        function(item) {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "info-item";


            div.innerHTML =
                `
                <span>
                    ${escapeHTML(item[0])}
                </span>

                <strong>
                    ${escapeHTML(
                        item[1] || "-"
                    )}
                </strong>
                `;


            studentInfo.appendChild(
                div
            );

        }
    );



    const resultTable =
        document.getElementById(
            "resultTable"
        );


    resultTable.innerHTML =
        "";



    data.results.forEach(
        function(result) {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML =
                `
                <td>
                    ${escapeHTML(
                        result.courseCode
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        result.grade
                    )}
                </td>
                `;


            resultTable.appendChild(
                row
            );

        }
    );



    resultSection.classList.remove(
        "hidden"
    );


    resultSection.scrollIntoView(
        {
            behavior:
                "smooth",
            block:
                "start"
        }
    );

}



function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ||
        "";


    return div.innerHTML;

}
