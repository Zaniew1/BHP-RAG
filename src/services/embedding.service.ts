
import {EMBEDDING_MODEL, OPENAI_API_KEY} from '../utils/constants'
import { OpenAIEmbeddings } from "@langchain/openai";

export interface EmbeddingModelInterface{
    embedText(text: string): Promise<number[]>
    embedTexts(texts: string[]): Promise<EmbeddedChunk[]>
}
export type EmbeddedChunk = {
    content: string;
    vector: number[];
};
export class EmbeddingClass implements EmbeddingModelInterface{
    constructor(private embedModel : EmbeddingModelInterface){
    }
    async embedText(text: string): Promise<number[]>{
        return await this.embedModel.embedText(text)
    }
    async embedTexts(texts: string[]): Promise<EmbeddedChunk[]>{
       return await this.embedModel.embedTexts(texts)

    }
}


export class OpenAiEmbed implements EmbeddingModelInterface{
    private model = new OpenAIEmbeddings({
        apiKey: OPENAI_API_KEY,
        model: EMBEDDING_MODEL,
    });
    async embedText(text: string): Promise<number[]> {
        if (!text.trim()) {
            throw new Error("Cannot embed empty text");
        }
        return await this.model.embedQuery(text);
    }
    async embedTexts(texts: string[]): Promise<EmbeddedChunk[]> {
        if (!texts.length) {
            throw new Error("No texts provided for embedding");
        }

        const vectors = await this.model.embedDocuments(texts);

        return texts.map((text, i) => ({
                content: text,
                vector: vectors[i],
            }));
        }
}

const openAiEmbedding = new OpenAiEmbed();
export const embedding = new EmbeddingClass(openAiEmbedding)