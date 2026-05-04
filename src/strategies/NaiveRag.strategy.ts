import { embedding, EmbeddingModelInterface } from "../services/embedding.service";
import { StoreChunkParams, vectorDatabase, VectorDBInterface } from "../services/vector.service";
import { llmModel, LLMModelInterface } from "../services/llm.service";

class NaiveRag {
    constructor(private embeddModel: EmbeddingModelInterface, private vectorDb:VectorDBInterface, private llmModel: LLMModelInterface){}
    public async implement(prompt: string): Promise<string> {
        const embeddedPrompt = await this.embeddPrompt(prompt)
        const similarChunks = await this.findPromptSimilarities(embeddedPrompt)
        const context = similarChunks.map((chunk) => chunk.content).join("\n\n");
        const response = await this.llmModel.generateAnswerWithRag(prompt, context);
        return response;
    }
    private async embeddPrompt(prompt: string): Promise<number[]> {
        return await this.embeddModel.embedText(prompt);
    }
    private async findPromptSimilarities(embeddedPrompt: number[], numberOfResults = 5): Promise<StoreChunkParams[]> {
        const results = await this.vectorDb.searchSimilarChunks(embeddedPrompt, numberOfResults);
        return results;
    }
}

export const naiveRag = new NaiveRag(embedding,vectorDatabase,llmModel)