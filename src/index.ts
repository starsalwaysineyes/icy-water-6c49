import { renderHtml } from "./renderHtml";

// Define the expected shape of the request body for POST requests
interface QueryRequestBody {
  query?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle POST requests for executing SQL
    if (request.method === "POST") {
      try {
        const body: QueryRequestBody = await request.json();
        const query = body.query;

        if (!query || typeof query !== 'string' || query.trim() === '') {
          return Response.json(
            { error: "Query parameter is missing or invalid.", cause: null },
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Basic validation: Disallow potentially harmful or meta commands simply
        // A more robust solution would involve parsing or more sophisticated checks.
        const lowerCaseQuery = query.toLowerCase().trim();
        if (lowerCaseQuery.startsWith('pragma') || lowerCaseQuery.startsWith('attach') || lowerCaseQuery.startsWith('detach') || lowerCaseQuery.startsWith('vacuum')) {
             return Response.json(
                { error: "Operation not allowed.", cause: "Certain PRAGMA, ATTACH, DETACH, or VACUUM commands are restricted." },
                { status: 403, headers: { 'Content-Type': 'application/json' } }
             );
        }

        // Prepare and execute the user's query
        const stmt = env.DB.prepare(query);
        const { results, success, meta } = await stmt.all();

        // Return results as JSON
        return Response.json(
          { results, success, meta },
          { headers: { 'Content-Type': 'application/json' } }
        );

      } catch (e: any) {
        // Handle errors during query execution or JSON parsing
        console.error("SQL Execution Error:", e);
        return Response.json(
          { error: e.message || "Failed to execute query", cause: e.cause?.message || 'Unknown cause' },
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle GET requests: Render the initial HTML page with the form
    // We pass null for initialContent, so the page shows "Submit a query..."
    return new Response(renderHtml(null), {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });
  },
} satisfies ExportedHandler<Env>;
