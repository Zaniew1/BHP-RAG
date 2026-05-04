import { ModelProvider } from "rerank";
import { embedding, EmbeddingModelInterface } from "../services/embedding.service";
import { StoreChunkParams, vectorDatabase, VectorDBInterface } from "../services/vector.service";
import { llmModel, LLMModelInterface } from "../services/llm.service";

class MultiQueryRag{
    constructor(private embeddModel: EmbeddingModelInterface, private vectorDb:VectorDBInterface, private llmModel: LLMModelInterface ){
    }

    public async implement(prompt: string): Promise<string> {
        const newPrompt: string = `Proszę wygenerować 5 alternatywnych zapytań dla tego zapytania: ${prompt},
                                    spróbuj uwzględnić różne perspektywy lub parafrazy, potrzebuję tego do RAG multiquery,
                                    wszystkie odpowiedzi powinny być oddzielone przecinkami  NIE PISZ NICZEGO INNEGO, NIE ROZDZIELAJ WIERSZY`;
        const newQueries = await this.llmModel.generateAnswerWithoutRag(newPrompt);
        const newQueriesArray = newQueries.split(",")
        const chunksFromAllQueries = await this.getCommonChunksForManyQueries(newQueriesArray);
        const context = chunksFromAllQueries.map((chunk) => chunk.content).join("\n\n");
        const response = await llmModel.generateAnswerWithRag(prompt, context);
        return response;
    }
    private async getCommonChunksForManyQueries(queries: string[]): Promise<StoreChunkParams[]>{
        const chunksFromAllQueries: StoreChunkParams[] = [];
        const seenIds = new Set<number>();
        for (const llmsPrompt of queries) {
            const embeddedPrompt = await this.embeddPrompt(llmsPrompt);
            const similarChunks = await this.findPromptSimilarities(embeddedPrompt, 4);
            for (const chunk of similarChunks) {
                chunk as StoreChunkParams;
                if (chunk.id !== undefined && !seenIds.has(chunk.id)) {
                    seenIds.add(chunk.id);
                    chunksFromAllQueries.push(chunk);
                }
            }
        }
        return chunksFromAllQueries
    }
    private async embeddPrompt(prompt: string): Promise<number[]> {
        return await this.embeddModel.embedText(prompt);
    }
    private async findPromptSimilarities(embeddedPrompt: number[], numberOfResults = 5): Promise<StoreChunkParams[]> {
        const results = await this.vectorDb.searchSimilarChunks(embeddedPrompt, numberOfResults);
        return results;
    }

}
export const multiQueryRag = new MultiQueryRag(embedding, vectorDatabase, llmModel);