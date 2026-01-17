export const extractJsonPayload = (response: string) => {
  const fencedMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : response;
  const trimmed = candidate.trim();

  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return trimmed.slice(start, end + 1);
    }
    return trimmed;
  }
};
