// Update credits based on the data attribute passed from the backend
let availableCredits = parseInt(document.getElementById('page-count').getAttribute('data-available-credits'), 10);

function updatePageCount() {
    const pageCountElement = document.getElementById('page-count');
    let content = pageCountElement.textContent;

    content = content.replace(`Webpages Available: `, '');

    availableCredits = parseInt(content, 10);

    availableCredits = availableCredits - 1;

    pageCountElement.textContent = `Webpages Available: ${availableCredits}`;
}

async function analyzeUrl() {
    const url = document.getElementById('website-url').value;
    const fileInput = document.getElementById('fileElem');

    // Check if the user has enough credits
    if (availableCredits <= 0) {
        alert("You are out of credits. Please upgrade your plan or wait until next month for more credits.");
        window.location.reload(); // Reload the page to prevent further analysis  
        return;
    }

    // Only proceed if the user has a valid URL and credits
    if (!url) {
        console.log('Please enter a valid URL.');
        return;
    }

    let htmlContent = '';

    // If a file is selected, read it as text
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        htmlContent = await readFileAsText(file); // Optimized with async/await
    }

    const payload = { url: url, html: htmlContent };

    // Show modal and reset progress when analysis starts
    toggleModal(true);
    resetProgressBar();

    // Simulate progress while fetching
    simulateProgressBar();

    try {
        const response = await fetch('/analyze-url/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            alert(data.error);
        } else {
            displayAnalysisResults(data);
            availableCredits--;
            updatePageCount(); // Update the displayed credits
        }
    } catch (error) {
        console.error('Error during fetch:', error);
    } finally {
        toggleModal(false); // Hide modal once analysis is complete
        resetProgressBar(); // Reset progress bar for future use
    }
}

// Helper function for file reading
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}


// Function to show or hide the modal
function toggleModal(show) {
    const modalElement = document.getElementById('analysisModal');
    
    // Get or create a Bootstrap modal instance with 'static' backdrop and no keyboard closing
    const analysisModal = bootstrap.Modal.getOrCreateInstance(modalElement, {
        backdrop: 'static', // Prevent closing by clicking outside
        keyboard: false     // Prevent closing with the escape key
    });

    if (show) {
        analysisModal.show();
    } else {
        analysisModal.hide();
    }
}

// Function to simulate progress of the progress bar
function simulateProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    let progress = 0;

    // Function to update progress quickly up to 50%
    const fastInterval1 = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
        progressBar.textContent = `${progress}%`;

        // Stop the fast progress at 50% and switch to medium
        if (progress >= 50) {
            clearInterval(fastInterval1);

            // Medium progress after 50% to 85%
            const fastInterval2 = setInterval(() => {
                progress += 5;
                progressBar.style.width = `${progress}%`;
                progressBar.setAttribute('aria-valuenow', progress);
                progressBar.textContent = `${progress}%`;

                // Stop the medium progress at 85% and switch to slower
                if (progress >= 85) {
                    clearInterval(fastInterval2);

                    // Slower progress after 85%
                    const slowInterval = setInterval(() => {
                        progress += 3;
                        progressBar.style.width = `${progress}%`;
                        progressBar.setAttribute('aria-valuenow', progress);
                        progressBar.textContent = `${progress}%`;

                        // Stop progress at 97%
                        if (progress >= 97) {
                            clearInterval(slowInterval);
                        }
                    }, 2500); // Slower update every 2500 milliseconds
                }
            }, 1500); // Medium update every 1500 milliseconds
        }
    }, 1000); // Fast update every 1000 milliseconds
}

// Function to reset the progress bar
function resetProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', 0);
    progressBar.textContent = '0%';
}

function displayAnalysisResults(data) {
    const updatedHtmlDiv = document.getElementById('updated-html');

    // Check if the element with id "updated-html" exists
    if (!updatedHtmlDiv) {
        console.error("Element with id 'updated-html' not found.");
        return; // Exit the function if the element is not found
    }

    updatedHtmlDiv.innerHTML = ''; // Clear existing content

    if (data.outputs && data.outputs.length > 0) {
        let updatedHtml = data.outputs.length > 1 ? data.outputs[1] : '';

        // Remove any pre-existing markdown or code formatting
        updatedHtml = updatedHtml.replace(/<pre>|<\/pre>|<code>|<\/code>/g, '');
        updatedHtml = updatedHtml.replace(/```html|```/g, '');

        // Display HTML inside the #updated-html div
        updatedHtmlDiv.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; font-size: 14px;"><code>${escapeHtml(updatedHtml)}</code></pre>`;

        // Get the position of the updated HTML div
        const rect = updatedHtmlDiv.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Adjust scroll position by a custom offset (e.g., 100px above the element)
        window.scrollTo({
            top: rect.top + scrollTop - 160, // Adjust this value based on your needs
            behavior: 'smooth' // Smooth scrolling effect
        });
    } else if (data.message) {
        updatedHtmlDiv.textContent = data.message;
    } else {
        updatedHtmlDiv.textContent = 'No outputs received from AI API.';
    }
}

// Helper function to escape HTML special characters for proper display
function escapeHtml(html) {
    return html.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
}

// Copy code function
function copyToClipboard(elementId) {
    const contentElement = document.getElementById(elementId);
    let content = contentElement.textContent || contentElement.innerText;

    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = content;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand("copy");
    document.body.removeChild(tempTextArea);

    console.log('Copied to clipboard:');
}


function displayFileName() {
    const fileInput = document.getElementById('fileElem');
    const fileName = fileInput.files[0] ? fileInput.files[0].name : '';
    document.getElementById('file-name').textContent = fileName ? 'Selected file: ' + fileName : '';
}

function handleDrop(event) {
    event.preventDefault();
    const dt = event.dataTransfer;
    const files = dt.files;
    if (files.length) {
        document.getElementById('fileElem').files = files;
        displayFileName();
    }
    document.getElementById('drop-area').classList.remove('hover');
}

function handleDragOver(event) {
    event.preventDefault();
    document.getElementById('drop-area').classList.add('hover');
}

function handleDragLeave(event) {
    document.getElementById('drop-area').classList.remove('hover');
}
