import { llmModel, LLMModelInterface } from './../services/llm.service';
import { embedding, EmbeddingModelInterface } from "../services/embedding.service";
import { DatabaseSelectStoreChunkParams, StoreChunkParams, vectorDatabase, VectorDBInterface } from "../services/vector.service";
import { LLMReranker, ModelProvider, ModelUsage, ProviderOpenAI } from "rerank";
import { LLM_MODEL, OPENAI_API_KEY } from "../utils/constants";

class RerankingRag {
    private reranker: LLMReranker;
    constructor(private embeddModel: EmbeddingModelInterface, private vectorDb:VectorDBInterface, private llmProvider: ModelProvider, private llmModel: LLMModelInterface ){
         this.reranker = new LLMReranker(this.llmProvider);
    }
    public async implement(prompt: string): Promise<string> {
        try{
            const embeddedPrompt = await this.embeddPrompt(prompt);
            const similarChunks = await this.findPromptSimilarities(embeddedPrompt, 10);
            const rerankedChunks = await this.rerankChunks(similarChunks, prompt);
            const top4Chunks =  rerankedChunks.slice(0, 4).map(chunkID=>{
                return +chunkID;
            })
            const chunksReranked = await this.vectorDb.getChunks(top4Chunks);
            const context = chunksReranked.map((chunk: DatabaseSelectStoreChunkParams) => chunk.content).join("\n\n");
            const response = await this.llmModel.generateAnswerWithRag(prompt, context);
            return response;
        }catch(e){
            throw Error("Nie udało sie wygenerować")
        }
    }
    private async rerankChunks(chunks: DatabaseSelectStoreChunkParams[], prompt:string): Promise<string[]>{
        const list = chunks.map(chunk=>{
            return {
                key: chunk.id,
                value: chunk.content
            }
        })
        const rerankedChunks = await this.reranker.rerank(list, "key", "value", prompt);
        return rerankedChunks.result;
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
export const rerankingRag = new RerankingRag(embedding, vectorDatabase, provider, llmModel)
