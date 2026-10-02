import { agent, input } from "@xanots/sdk";

// The AI agent behind agent/retrieve. It does ONE narrow job: map a plain-language
// request to exactly one record id from the catalog it is handed, with structured
// output so the endpoint gets a clean { record_id, rationale }. It has no tools and
// no external credentials (Xano's free model), and it never decides disclosure:
// the endpoint runs the SAME evaluate_disclosure rule on whatever record it picks,
// at the fixed least-privileged "agent" clearance. If nothing matches it returns 0,
// and the endpoint answers 404.
export const record_resolver = agent({
  name: "record_resolver",
  canonical: "record-resolver",
  description: "Resolves a plain-language records request to one record id from a supplied catalog.",
  llm: {
    type: "xano-free",
    maxSteps: 1,
    systemPrompt: [
      "You match a plain-language request for a government record to exactly one record in a catalog.",
      "The catalog is a JSON array of records, each with an id, title, and summary:",
      "{{ $args.catalog }}",
      "",
      "Return the id of the single best matching record in record_id, and one short sentence in rationale explaining the match.",
      "If no record is a plausible match, return record_id 0 and say so in rationale.",
      "Never invent an id that is not in the catalog.",
    ].join("\n"),
    prompt: "Request: {{ $args.q }}",
  },
  output: {
    schema: {
      record_id: input.int({ required: true }),
      rationale: input.text({ required: true }),
    },
  },
});
