import { computeWikiLayout } from "./wikiLayout";
import type { WikiGraph } from "./wikiGraph";
// Finite physics stays off the UI thread; browsing never runs a simulation loop.
self.onmessage = ({ data }: MessageEvent<WikiGraph>) => {
  try {
    self.postMessage({ positions: computeWikiLayout(data) });
  } catch {
    self.postMessage({ error: "Não foi possível organizar as conexões." });
  }
};
