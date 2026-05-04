import { EmbeddingModelInterface } from "../services/embedding.service";
import { StoreChunkParams, VectorDBInterface } from "../services/vector.service";

class NaiveRag {
    constructor(private embeddModel: EmbeddingModelInterface, private vectorDb:VectorDBInterface){}
    public async implement(prompt: string): Promise<string> {
        const embeddedPrompt = await this.embeddPrompt(prompt)
        const similarChunks = await this.findPromptSimilarities(embeddedPrompt)
        const context = similarChunks.map((chunk) => chunk.content).join("\n\n");
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