document.addEventListener('DOMContentLoaded', () => {
    // Get necessary DOM elements
    const quizSelect = document.getElementById('quiz-select');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const quizSelectionDiv = document.getElementById('quiz-selection');
    const quizContainer = document.getElementById('quiz-container');
    const questionNumberDiv = document.getElementById('question-number');
    const questionDiv = document.getElementById('question');
    const optionsDiv = document.getElementById('options');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const resultContainer = document.getElementById('result-container');
    const scoreSpan = document.getElementById('score');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const retakeQuizBtn = document.getElementById('retake-quiz-btn');
    const incorrectQuestionsList = document.getElementById('incorrect-questions-list'); // Element to display list of incorrect questions
    const reviewQuizBtn = document.getElementById('review-quiz-btn'); // Review quiz button

    // Global variables to store quiz state
    let currentQuiz = []; // Array containing questions of the current quiz
    let currentQuestionIndex = 0; // Index of the current question being displayed
    let userAnswers = []; // Array to store user's answers for each question (index of the selected option)
    let incorrectQuestions = []; // Array to store incorrectly answered questions
    let isReviewMode = false; // Flag to check if currently in review mode

    // --- CẬP NHẬT: Danh sách các file đề thi được điền bằng tay tại đây ---
    // Bạn cần chỉnh sửa mảng này mỗi khi thêm hoặc xóa file JSON đề thi trong thư mục 'data/'
    const quizFiles = [
        'de1_noinha_nhachu.json',
        'de2_noinha_nhachu.json',
        'de3_noinha_nhachu.json',
        'de4_noinha_nhachu.json',
        'de5_noinha_nhachu.json',
        'de6_noinha_nhachu.json',
        'de7_lay_tuy_buong.json',
        'de8_lay_tuy_buong.json',
        'de9_lay_tuy_buong.json',
        

    ];
    // --- KẾT THÚC CẬP NHẬT ---

    /**
     * Function to populate the quiz selection dropdown menu.
     * It now reads the hardcoded 'quizFiles' array.
     */
    async function populateQuizSelection() {
        console.log('Attempting to populate quiz selection from hardcoded list...');
        try {
            // Clear old options before adding new ones
            quizSelect.innerHTML = '<option value="">-- Chọn đề thi --</option>';

            // Add quiz options to the dropdown
            if (quizFiles.length === 0) {
                console.warn('No quiz files found in the hardcoded list. Dropdown will be empty.');
            }

            for (const file of quizFiles) {
                const option = document.createElement('option');
                option.value = `data/${file}`; // Full path to the JSON file
                // Display the filename in a user-friendly way (e.g., "MATH QUIZ")
                option.textContent = file.replace('.json', '').replace(/_/g, ' ').toUpperCase();
                quizSelect.appendChild(option);
                console.log(`Added option: ${option.textContent} with value ${option.value}`);
            }
            console.log('Finished populating quiz selection.');
        } catch (error) {
            // Lỗi ở đây sẽ ít xảy ra hơn vì không còn fetch quiz_manifest.json
            console.error('Lỗi khi điền danh sách đề thi vào dropdown:', error);
            alert('Có lỗi xảy ra khi tạo danh sách đề thi. Vui lòng kiểm tra console log.');
        }
    }

    /**
     * Function to load a quiz from a specific JSON file.
     * @param {string} filepath - Path to the quiz JSON file.
     */
    async function loadQuiz(filepath) {
        console.log(`Attempting to load quiz from: ${filepath}`);
        try {
            const response = await fetch(filepath);
            if (!response.ok) {
                console.error(`Fetch error: HTTP status ${response.status} for ${filepath}`);
                // Handle error if file cannot be loaded
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            currentQuiz = await response.json(); // Convert response to JSON object
            console.log(`Successfully loaded quiz with ${currentQuiz.length} questions.`);
            userAnswers = Array(currentQuiz.length).fill(null); // Initialize userAnswers array with nulls
            incorrectQuestions = []; // Reset incorrect questions list
            currentQuestionIndex = 0; // Reset to the first question
            isReviewMode = false; // Ensure not in review mode when starting a new quiz
            displayQuestion(); // Display the first question
            
            // Switch display between quiz selection and quiz container
            quizSelectionDiv.style.display = 'none';
            quizContainer.style.display = 'block';
            resultContainer.style.display = 'none'; // Ensure results are hidden if displayed
        } catch (error) {
            console.error('Lỗi khi tải đề thi:', error);
            alert('Không thể tải đề thi. Vui lòng kiểm tra lại đường dẫn hoặc file JSON.');
        }
    }

    /**
     * Function to display the current question on the interface.
     * Updates question number, question content, and answer options.
     */
    function displayQuestion() {
        if (currentQuiz.length === 0) {
            console.warn('No quiz loaded, cannot display question.');
            return; // Do nothing if no quiz is loaded
        }

        const questionData = currentQuiz[currentQuestionIndex];
        questionNumberDiv.textContent = `Câu ${currentQuestionIndex + 1} / ${currentQuiz.length}`;
        questionDiv.textContent = questionData.question;
        optionsDiv.innerHTML = ''; // Clear old options to prepare for the new question
        console.log(`Displaying question ${currentQuestionIndex + 1}: ${questionData.question}`);

        // Create answer options for the current question
        questionData.options.forEach((optionText, index) => {
            const optionItem = document.createElement('div');
            optionItem.classList.add('option-item');

            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = 'answer'; // Same name to allow only one selection
            radioInput.id = `option${index}`;
            radioInput.value = index;
            radioInput.classList.add('hidden-radio'); // Class to hide the native radio in CSS
            radioInput.disabled = isReviewMode; // Disable input if in review mode

            const customRadio = document.createElement('span');
            customRadio.classList.add('radio-custom'); // Class to create custom radio in CSS

            const label = document.createElement('label');
            // CẬP NHẬT: Thêm ký tự A, B, C... vào trước mỗi đáp án
            label.setAttribute('for', `option${index}`);
            label.textContent = `${String.fromCharCode(65 + index)}. ${optionText}`; // 65 là mã ASCII của 'A'

            optionItem.appendChild(radioInput);
            optionItem.appendChild(customRadio);
            optionItem.appendChild(label);
            optionsDiv.appendChild(optionItem);

            // Attach click event to the entire option-item div (only if not in review mode)
            if (!isReviewMode) {
                optionItem.addEventListener('click', () => {
                    // Deselect all other options for the current question
                    document.querySelectorAll('.option-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    // Select the current option
                    optionItem.classList.add('selected');
                    radioInput.checked = true; // Set checked for the hidden radio input
                    userAnswers[currentQuestionIndex] = index; // Save user's answer
                    console.log(`User selected option ${index} for question ${currentQuestionIndex + 1}`);
                });
            }

            // If the user has already selected an answer for this question, re-display the selected option
            if (userAnswers[currentQuestionIndex] === index) {
                optionItem.classList.add('selected');
                radioInput.checked = true;
                console.log(`Option ${index} pre-selected for question ${currentQuestionIndex + 1}`);
            }

            // If in review mode, highlight the correct answer and the user's selected answer
            if (isReviewMode) {
                // Highlight the correct answer
                if (index === questionData.answer) {
                    optionItem.classList.add('correct-answer');
                }
                // Highlight the user's selected answer (if incorrect)
                if (userAnswers[currentQuestionIndex] === index && userAnswers[currentQuestionIndex] !== questionData.answer) {
                    optionItem.classList.add('incorrect-selected');
                }
            }
        });

        // Update state of navigation buttons
        prevBtn.disabled = currentQuestionIndex === 0; // Disable "Previous" if at the first question
        nextBtn.disabled = currentQuestionIndex === currentQuiz.length - 1; // Disable "Next" if at the last question
        
        // Display "Submit" button only if at the last question and not in review mode
        submitBtn.style.display = (currentQuestionIndex === currentQuiz.length - 1 && !isReviewMode) ? 'inline-block' : 'none';

        // Handle "Back to Results" button in review mode
        const existingBackBtn = document.getElementById('back-to-results-btn');
        if (isReviewMode) {
            if (!existingBackBtn) { // Create button only if it doesn't exist
                const backToResultsBtn = document.createElement('button');
                backToResultsBtn.id = 'back-to-results-btn';
                backToResultsBtn.textContent = 'Quay lại kết quả';
                backToResultsBtn.addEventListener('click', () => {
                    console.log('Exiting review mode and returning to results.');
                    isReviewMode = false; // Exit review mode
                    quizContainer.style.display = 'none';
                    resultContainer.style.display = 'block';
                    // Remove the "Back to Results" button after exiting review
                    if (backToResultsBtn.parentNode) {
                        backToResultsBtn.parentNode.removeChild(backToResultsBtn);
                    }
                });
                document.querySelector('.navigation-buttons').appendChild(backToResultsBtn);
            }
            // Hide submit button when in review mode
            submitBtn.style.display = 'none';
        } else {
            // Ensure "Back to Results" button is not displayed when not in review
            if (existingBackBtn && existingBackBtn.parentNode) {
                existingBackBtn.parentNode.removeChild(existingBackBtn);
            }
        }
    }

    // --- Event handlers for navigation buttons ---
    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--; // Decrement question index
            displayQuestion(); // Display new question
            console.log(`Moved to previous question: ${currentQuestionIndex + 1}`);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < currentQuiz.length - 1) {
            currentQuestionIndex++; // Increment question index
            displayQuestion(); // Display new question
            console.log(`Moved to next question: ${currentQuestionIndex + 1}`);
        }
    });

    // --- Event handler for "Submit" button click ---
    submitBtn.addEventListener('click', () => {
        console.log('Submit button clicked. Calculating score...');
        let score = 0;
        incorrectQuestions = []; // Reset incorrect questions list before scoring

        // Iterate through all questions to score
        currentQuiz.forEach((question, index) => {
            // If user selected an answer and it's correct
            if (userAnswers[index] !== null && userAnswers[index] === question.answer) {
                score++; // Increment score
            } else {
                // If incorrect or not answered, add to the list of incorrect questions
                incorrectQuestions.push({
                    index: index,
                    question: question.question
                });
            }
        });

        // Display results
        scoreSpan.textContent = score;
        totalQuestionsSpan.textContent = currentQuiz.length;
        quizContainer.style.display = 'none'; // Hide quiz container
        resultContainer.style.display = 'block'; // Display results container
        console.log(`Quiz submitted. Score: ${score}/${currentQuiz.length}. Incorrect questions: ${incorrectQuestions.length}`);
        
        // Display the list of incorrect questions
        displayIncorrectQuestions();
    });

    /**
     * Function to display the list of incorrectly answered questions on the results screen.
     */
    function displayIncorrectQuestions() {
        incorrectQuestionsList.innerHTML = ''; // Clear old list
        if (incorrectQuestions.length === 0) {
            incorrectQuestionsList.innerHTML = '<li>Chúc mừng! Bạn đã trả lời đúng tất cả các câu hỏi.</li>';
            console.log('All questions answered correctly!');
        } else {
            console.log('Displaying incorrect questions:');
            incorrectQuestions.forEach(item => {
                const listItem = document.createElement('li');
                // Create a link so the user can click to review that specific question
                const questionLink = document.createElement('a');
                questionLink.href = '#'; // Set href to # to prevent page reload
                questionLink.textContent = `Câu ${item.index + 1}: ${item.question}`;
                questionLink.addEventListener('click', (e) => {
                    e.preventDefault(); // Prevent default link behavior
                    console.log(`Reviewing question ${item.index + 1} from incorrect list.`);
                    startReview(item.index); // Start review from this incorrect question
                });
                listItem.appendChild(questionLink);
                incorrectQuestionsList.appendChild(listItem);
                console.log(`- Added link for question ${item.index + 1}`);
            });
        }
    }

    /**
     * Function to start review mode.
     * @param {number} startIndex - The index of the question to start reviewing from (defaults to 0).
     */
    function startReview(startIndex = 0) {
        console.log(`Starting review mode from question index: ${startIndex}`);
        isReviewMode = true;
        currentQuestionIndex = startIndex;
        quizContainer.style.display = 'block';
        quizSelectionDiv.style.display = 'none';
        resultContainer.style.display = 'none';
        displayQuestion(); // Display the question in review mode
    }

    // --- Event handler for "Review Quiz" button click ---
    reviewQuizBtn.addEventListener('click', () => {
        console.log('Review Quiz button clicked.');
        startReview();
    });

    // --- Event handler for "Retake Quiz" button click ---
    retakeQuizBtn.addEventListener('click', () => {
        console.log('Retake Quiz button clicked. Resetting quiz state.');
        resultContainer.style.display = 'none'; // Hide results container
        quizSelectionDiv.style.display = 'block'; // Show quiz selection screen again
        quizSelect.value = ''; // Reset dropdown selection
        currentQuiz = []; // Clear current quiz
        userAnswers = []; // Clear all old user answers
        incorrectQuestions = []; // Clear incorrect questions list
        currentQuestionIndex = 0; // Reset question index
        isReviewMode = false; // Exit review mode
    });

    // --- Event handler for "Start Quiz" button click ---
    startQuizBtn.addEventListener('click', () => {
        const selectedQuizFile = quizSelect.value; // Get the selected JSON file path
        console.log(`Start Quiz button clicked. Selected file: ${selectedQuizFile}`);
        if (selectedQuizFile) {
            loadQuiz(selectedQuizFile); // Load and start the quiz
        } else {
            alert('Vui lòng chọn một đề thi để bắt đầu.');
        }
    });

    // Call populateQuizSelection when the page is fully loaded
    populateQuizSelection();
});
