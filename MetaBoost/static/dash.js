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
    const updatedHtmlDiv = document.getElementById('updated-html');
    updatedHtmlDiv.innerHTML = ''; // Clear existing content

    if (data.outputs && data.outputs.length > 0) {
        let updatedHtml = data.outputs.length > 1 ? data.outputs[1] : '';

        // Remove any pre-existing markdown or code formatting
        updatedHtml = updatedHtml.replace(/<pre>|<\/pre>|<code>|<\/code>/g, '');
        updatedHtml = updatedHtml.replace(/```html|```/g, '');

        // Format the HTML to show properly in the <pre> and <code> tags
        const formattedHtml = `<pre style="white-space: pre-wrap; font-family: monospace; font-size: 14px;"><code>${escapeHtml(updatedHtml)}</code></pre>`;
        updatedHtmlDiv.innerHTML = formattedHtml;
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

function updatePageCount() {
    document.getElementById('page-count').textContent = 'Pages Analyzed: ' + pagesAnalyzed + '/3';
}