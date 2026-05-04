import { embedding, EmbeddingModelInterface } from "../services/embedding.service";
import { StoreChunkParams, vectorDatabase, VectorDBInterface } from "../services/vector.service";
import { LLMReranker, ModelProvider, ProviderOpenAI } from "rerank";
import { LLM_MODEL, OPENAI_API_KEY } from "../utils/constants";

// NIE SKONCZONE
class RerankingRag {
    private reranker: LLMReranker;
    constructor(private embeddModel: EmbeddingModelInterface, private vectorDb:VectorDBInterface, private llmProvider: ModelProvider ){
         this.reranker = new LLMReranker(this.llmProvider);
    }
    public async implement(prompt: string): Promise<string> {
        const embeddedPrompt = await this.embeddPrompt(prompt);
        const similarChunks = await this.findPromptSimilarities(embeddedPrompt, 20);
      
        const rerankedChunks = await this.reranker.rerank(similarChunks, "id", "content", prompt);
        const top4Chunks = rerankedChunks.result.slice(0, 4);
        const context = top4Chunks.map((chunk: string) => chunk).join("\n\n");
        console.log(context)
        return context;
    }
    private async embeddPrompt(prompt: string): Promise<number[]> {
        return await this.embeddModel.embedText(prompt);
    }
    private async findPromptSimilarities(embeddedPrompt: number[], numberOfResults = 5): Promise<StoreChunkParams[]> {
        const results = await this.vectorDb.searchSimilarChunks(embeddedPrompt, numberOfResults);
        return results;
    }
}

const provider = new ProviderOpenAI(LLM_MODEL, OPENAI_API_KEY);
export const rerankingRag = new RerankingRag(embedding, vectorDatabase, provider)
