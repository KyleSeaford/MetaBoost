let pagesAnalyzed = 0; // Counter for pages analyzed

function analyzeUrl() {
    const url = document.getElementById('website-url').value;
    const fileInput = document.getElementById('fileElem');

    if (url) {
        let htmlContent = '';

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = function (event) {
                htmlContent = event.target.result;

                const payload = { url: url, html: htmlContent };

                fetch('/analyze-url/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                })
                .then(response => response.json())
                .then(data => {
                    displayAnalysisResults(data); // Display the updated HTML content
                })
                .catch(error => console.error('Error during fetch:', error));
            };

            reader.readAsText(file);
        } else {
            const payload = { url: url };

            fetch('/analyze-url/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                displayAnalysisResults(data);
            })
            .catch(error => console.error('Error during fetch:', error));
        }
    } else {
        console.log('Please enter a valid URL.');
    }
}

function displayAnalysisResults(data) {
    if (data.outputs && data.outputs.length > 0) {
        const updatedHtml = data.outputs.length > 1 ? data.outputs[1] : '';

        const updatedHtmlDiv = document.getElementById('updated-html');
        if (updatedHtml) {
            updatedHtmlDiv.innerHTML = `<pre><code>${escapeHtml(updatedHtml)}</code></pre>`;
        } else {
            updatedHtmlDiv.innerHTML = '<p class="text-muted">No code updated yet...</p>';
        }

    } else if (data.message) {
        document.getElementById('updated-html').textContent = data.message;
    } else {
        document.getElementById('updated-html').textContent = 'No outputs received from AI API.';
    }
}

// Function to extract only the updated HTML from the AI output
function extractUpdatedHtml(output) {
    const updatedHtmlMatch = output.match(/<html[^>]*>([\s\S]*?)<\/html>/); // Match content between <html> tags
    return updatedHtmlMatch ? updatedHtmlMatch[0] : ''; // Return the matched HTML code
}

// Function to escape HTML special characters for displaying as plain text
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
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

function updatePageCount() {
    document.getElementById('page-count').textContent = 'Pages Analyzed: ' + pagesAnalyzed + '/3';
}