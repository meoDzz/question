document.addEventListener('DOMContentLoaded', () => {
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

    let currentQuiz = [];
    let currentQuestionIndex = 0;
    let userAnswers = []; // Lưu trữ đáp án của người dùng (chỉ số của đáp án đã chọn)
    const quizFiles = ['topic_noinha_nhachu.json']; // Danh sách các file đề thi trong thư mục 'data/'

    // --- Khởi tạo Dropdown chọn đề thi ---
    async function populateQuizSelection() {
        for (const file of quizFiles) {
            const option = document.createElement('option');
            option.value = `data/${file}`;
            option.textContent = file.replace('.json', '').replace(/_/g, ' ').toUpperCase(); // Hiển thị tên file đẹp hơn
            quizSelect.appendChild(option);
        }
    }

    // --- Tải đề thi từ file JSON ---
    async function loadQuiz(filepath) {
        try {
            const response = await fetch(filepath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            currentQuiz = await response.json();
            userAnswers = Array(currentQuiz.length).fill(null); // Khởi tạo mảng đáp án người dùng
            currentQuestionIndex = 0;
            displayQuestion();
            quizSelectionDiv.style.display = 'none';
            quizContainer.style.display = 'block';
            resultContainer.style.display = 'none'; // Đảm bảo ẩn kết quả nếu đang hiển thị
        } catch (error) {
            console.error('Error loading quiz:', error);
            alert('Không thể tải đề thi. Vui lòng thử lại.');
        }
    }

    // --- Hiển thị câu hỏi hiện tại ---
    function displayQuestion() {
        if (currentQuiz.length === 0) return;

        const questionData = currentQuiz[currentQuestionIndex];
        questionNumberDiv.textContent = `Câu ${currentQuestionIndex + 1} / ${currentQuiz.length}`;
        questionDiv.textContent = questionData.question;
        optionsDiv.innerHTML = ''; // Xóa các lựa chọn cũ

        questionData.options.forEach((optionText, index) => {
            const optionItem = document.createElement('div');
            optionItem.classList.add('option-item');

            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = 'answer';
            radioInput.id = `option${index}`;
            radioInput.value = index;
            radioInput.classList.add('hidden-radio'); // Dùng class để ẩn radio gốc

            const customRadio = document.createElement('span');
            customRadio.classList.add('radio-custom');

            const label = document.createElement('label');
            label.setAttribute('for', `option${index}`);
            label.textContent = optionText;

            optionItem.appendChild(radioInput);
            optionItem.appendChild(customRadio);
            optionItem.appendChild(label);
            optionsDiv.appendChild(optionItem);

            // Gắn sự kiện click cho div option-item
            optionItem.addEventListener('click', () => {
                // Bỏ chọn tất cả các lựa chọn khác
                document.querySelectorAll('.option-item').forEach(item => {
                    item.classList.remove('selected');
                });
                // Chọn lựa chọn hiện tại
                optionItem.classList.add('selected');
                radioInput.checked = true; // Đặt checked cho radio input ẩn
                userAnswers[currentQuestionIndex] = index; // Lưu đáp án người dùng
            });

            // Nếu người dùng đã chọn đáp án cho câu này trước đó, hiển thị lại lựa chọn
            if (userAnswers[currentQuestionIndex] === index) {
                optionItem.classList.add('selected');
                radioInput.checked = true;
            }
        });

        // Cập nhật trạng thái nút "Câu trước" và "Câu sau"
        prevBtn.disabled = currentQuestionIndex === 0;
        nextBtn.disabled = currentQuestionIndex === currentQuiz.length - 1;
        submitBtn.style.display = (currentQuestionIndex === currentQuiz.length - 1) ? 'inline-block' : 'none';
    }

    // --- Chuyển câu hỏi ---
    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < currentQuiz.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        }
    });

    // --- Nộp bài và chấm điểm ---
    submitBtn.addEventListener('click', () => {
        let score = 0;
        currentQuiz.forEach((question, index) => {
            if (userAnswers[index] !== null && userAnswers[index] === question.answer) {
                score++;
            }
        });

        scoreSpan.textContent = score;
        totalQuestionsSpan.textContent = currentQuiz.length;
        quizContainer.style.display = 'none';
        resultContainer.style.display = 'block';
    });

    // --- Bắt đầu lại bài thi ---
    retakeQuizBtn.addEventListener('click', () => {
        resultContainer.style.display = 'none';
        quizSelectionDiv.style.display = 'block'; // Quay lại màn hình chọn đề
        quizSelect.value = ''; // Reset lựa chọn
        currentQuiz = []; // Xóa đề thi hiện tại
        userAnswers = []; // Xóa đáp án cũ
        currentQuestionIndex = 0;
    });

    // --- Xử lý sự kiện khi click nút "Bắt đầu thi" ---
    startQuizBtn.addEventListener('click', () => {
        const selectedQuizFile = quizSelect.value;
        if (selectedQuizFile) {
            loadQuiz(selectedQuizFile);
        } else {
            alert('Vui lòng chọn một đề thi để bắt đầu.');
        }
    });

    // Gọi hàm populate Quiz Selection khi trang tải xong
    populateQuizSelection();
});