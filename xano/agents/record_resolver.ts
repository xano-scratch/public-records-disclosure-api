import { agent, input } from "@xanots/sdk";

// The Play-4 surface: an LLM that maps a citizen's plain-language records request
// to exactly one record id from a bounded catalog. It runs on Xano's free model,
// takes no external credentials, and returns structured output so the endpoint can
// hand the id straight to the SAME disclosure rule a human read would use.
//
// It has no tools, it only routes a request to a record; the governed disclosure
// then happens in the endpoint, under the same rule and audit as a human caller.
export const recordResolver = agent({
  name: "record_resolver",
  description:
    "Resolves a plain-language public-records request to a single record id from a bounded catalog, so the agent read path resolves the same record a human would.",
  llm: {
    type: "xano-free",
    maxSteps: 1,
    systemPrompt:
      "You route a citizen's public-records request to exactly one record from a fixed catalog. " +
      "Pick the single best match by title, type, and summary. If nothing clearly matches, return record_id 0. " +
      "Never invent an id that is not in the catalog. Keep the rationale to one sentence.",
    prompt:
      "Catalog (one record per line, formatted `#id: title (type) - summary`):\n{{ $args.catalog }}\n\n" +
      "Citizen request: {{ $args.question }}\n\n" +
      "Return the best matching record_id (0 if none matches) and a one-sentence rationale.",
  },
  output: {
    schema: {
      record_id: input.int({ required: true }),
      rationale: input.text({ required: true }),
    },
  },
});
