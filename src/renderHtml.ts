export function renderHtml(initialContent: string | null = null, initialQuery: string = "SELECT * FROM comments LIMIT 3") {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>D1 SQL Runner</title>
        <link rel="stylesheet" type="text/css" href="https://static.integrations.cloudflare.com/styles.css">
        <style>
          textarea {
            width: 100%;
            min-height: 100px;
            margin-bottom: 10px;
            font-family: monospace;
          }
          pre {
            background-color: #f4f4f4;
            border: 1px solid #ddd;
            padding: 10px;
            overflow-x: auto;
            min-height: 50px; /* Ensure pre block is visible even when empty */
          }
          .error {
            color: red;
            font-weight: bold;
          }
        </style>
      </head>

      <body>
        <header>
          <img
            src="https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/30e0d3f6-6076-40f8-7abb-8a7676f83c00/public"
          />
          <h1>D1 SQL Runner</h1>
        </header>
        <main>
          <form id="sqlForm">
            <label for="sqlQuery">Enter SQL Query:</label>
            <textarea id="sqlQuery" name="sqlQuery" required>${initialQuery}</textarea>
            <button type="submit">Run Query</button>
          </form>
          <p>Result:</p>
          <pre><code id="resultOutput">${initialContent ? initialContent : 'Submit a query to see results.'}</code></pre>
          <small class="blue">
            <a target="_blank" href="https://developers.cloudflare.com/d1/">D1 Documentation</a>
          </small>
        </main>
        <script>
          const sqlForm = document.getElementById('sqlForm');
          const sqlQueryInput = document.getElementById('sqlQuery');
          const resultOutput = document.getElementById('resultOutput');

          sqlForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const query = sqlQueryInput.value;
            resultOutput.textContent = 'Running query...'; // Provide feedback

            try {
              const response = await fetch(window.location.pathname, { // Send to the same worker URL
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
              });

              const data = await response.json();

              if (!response.ok) {
                // Display error from backend if available, otherwise generic error
                 resultOutput.innerHTML = \`<span class="error">Error: \${data.error || response.statusText}</span>\`;
                 if (data.cause) {
                    resultOutput.innerHTML += \`<br><span class="error">Cause: \${data.cause}</span>\`;
                 }
              } else {
                 // Format success result as JSON string
                 resultOutput.textContent = JSON.stringify(data.results || [], null, 2);
              }
            } catch (error) {
              console.error('Fetch error:', error);
              resultOutput.innerHTML = \`<span class="error">Client-side error: \${error.message}</span>\`;
            }
          });

          // Optional: Run initial query on load if content is provided
          // (We might remove this depending on backend changes)
          // if (!'${initialContent}') {
          //  // Maybe trigger the form submission for the default query on load?
          //  // sqlForm.requestSubmit(); // Or keep it empty until user interaction
          // }
        </script>
      </body>
    </html>
`;
}
