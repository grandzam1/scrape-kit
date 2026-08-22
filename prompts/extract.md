# ROLE
You extract structured conversation exchanges from scraped markdown.

# SOURCE OF TRUTH
The markdown below is the ONLY source of truth.
Do not invent, assume, reorder, or add content.
If something is unclear, mark it as: [UNCLEAR FROM SOURCE]

# TASK
Extract the last {{last_n}} user messages and their corresponding assistant replies.

# OUTPUT
Return a single JSON object matching this schema:
{{output_schema}}

Rules:
- Preserve full message text.
- Keep chronological order (oldest of the selected window first).
- If fewer than {{last_n}} exchanges exist, return all that exist and note that in title if needed.
- Do not include UI chrome, navigation, or disclaimers.

# MARKDOWN SOURCE
{{markdown}}
