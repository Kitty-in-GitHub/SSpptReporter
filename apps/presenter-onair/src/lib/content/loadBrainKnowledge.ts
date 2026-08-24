import {
  buildBrainKnowledge,
  buildSlideIndex,
  type BrainKnowledge,
  type SlideMarkdownFile,
} from '@ssreporter/brain';

async function fetchText(url: string): Promise<string | null> {
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  return response.text();
}

async function loadSlideFiles(deckId: string): Promise<SlideMarkdownFile[]> {
  const files: SlideMarkdownFile[] = [];
  for (let page = 1; page <= 40; page += 1) {
    const filename = `${String(page).padStart(2, '0')}.md`;
    const content = await fetchText(
      `/content/decks/${deckId}/slides/${filename}`,
    );
    if (!content) {
      break;
    }
    files.push({ filename, content });
  }
  return files;
}

export async function loadBrainKnowledgeForDeck(
  deckId: string,
): Promise<BrainKnowledge> {
  const personaText = (await fetchText('/content/persona/presenter.md')) ?? '';
  const deckFaq = await fetchText(`/content/faq/${deckId}.md`);
  const faqMarkdown =
    deckFaq ?? (await fetchText('/content/faq/demo.md')) ?? '';
  const slideFiles = await loadSlideFiles(deckId);
  const slideIndex = buildSlideIndex(deckId, slideFiles);

  return buildBrainKnowledge({
    personaText,
    faqMarkdown,
    faqId: deckId,
    deckId,
    slideEntries: slideIndex.map((entry) => ({
      page: entry.page,
      body: entry.body,
    })),
  });
}
