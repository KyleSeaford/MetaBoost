// Update credits based on the data attribute passed from the backend
let availableCredits = parseInt(document.getElementById('page-count').getAttribute('data-available-credits'), 10);

function updatePageCount() {
    // Assuming the maxCredits is 3 for a free plan
    const maxCredits = 3; // You can set this dynamically based on user plan if needed
    const pagesAnalyzed = maxCredits - availableCredits; // Calculate pages analyzed
    document.getElementById('page-count').textContent = `Webpages Available: ${availableCredits}`;
}

function analyzeUrl() {
    const url = document.getElementById('website-url').value;
    const fileInput = document.getElementById('fileElem');

    // Check if the user has enough credits
    if (availableCredits <= 0) {
        alert("You are out of credits. Please upgrade your plan or wait until next month for more credits.");
        window.location.reload(); // Reload the page to prevent further analysis  
        return; // Stop here if the user doesn't have enough credits
    }

    // Only proceed if the user has credits
    if (url) {
        let htmlContent = '';

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = function (event) {
                htmlContent = event.target.result;

                const payload = { url: url, html: htmlContent };

                // Show modal and reset progress when analysis starts
                toggleModal(true); // Prevent it from showing when credits are 0
                resetProgressBar();

                // Simulate progress while fetching
                simulateProgressBar();

                fetch('/analyze-url/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        alert(data.error);
                    } else {
                        displayAnalysisResults(data);
                        // Deduct a credit and update the UI if analysis is successful
                        availableCredits--;
                        updatePageCount(); // Call this function to update the displayed credits
                    }
                })
                .catch(error => console.error('Error during fetch:', error))
                .finally(() => {
                    toggleModal(false); // Hide modal once analysis is complete
                    resetProgressBar(); // Reset progress bar for future use
                });
            };

            reader.readAsText(file);
        } else {
            const payload = { url: url };

            // Show modal and reset progress when analysis starts
            toggleModal(true); // Move this inside to prevent it from showing when credits are 0
            resetProgressBar();

            // Simulate progress while fetching
            simulateProgressBar();

            fetch('/analyze-url/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    displayAnalysisResults(data);
                    // Deduct a credit and update the UI if analysis is successful
                    availableCredits--;
                    updatePageCount(); // Call this function to update the displayed credits
                }
            })
            .catch(error => console.error('Error during fetch:', error))
            .finally(() => {
                toggleModal(false); // Hide modal once analysis is complete
                resetProgressBar(); // Reset progress bar for future use
            });
        }
    } else {
        console.log('Please enter a valid URL.');
    }
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

    // Function to update progress before 85%
    const fastInterval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
        progressBar.textContent = `${progress}%`;

        // Stop the fast progress at 85% and switch to slower
        if (progress >= 85) {
            clearInterval(fastInterval);

            // slower progress after 85%
            const slowInterval = setInterval(() => {
                progress += 3;
                progressBar.style.width = `${progress}%`;
                progressBar.setAttribute('aria-valuenow', progress);
                progressBar.textContent = `${progress}%`;

                // Stop progress at 99%
                if (progress >= 97) {
                    clearInterval(slowInterval);
                }
            }, 2500); // Slower update every 2500 milliseconds
        }
    }, 1500); // Fast update every 1500 milliseconds
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
