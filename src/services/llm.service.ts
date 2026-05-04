import { ChatOpenAI } from "@langchain/openai";
import { LLM_MODEL, OPENAI_API_KEY } from "../utils/constants";
import { rag, RagInterface } from "./rag.service";


export interface LLMModelInterface{
    generateAnswerWithRag(prompt: string, context: string): Promise<string>
    generateAnswerWithoutRag(prompt: string): Promise<string>
}

export class LLM implements LLMModelInterface{
    constructor(private rag: RagInterface){}
    private llm = new ChatOpenAI({
        model: LLM_MODEL,
        temperature: 0.2,
        apiKey: OPENAI_API_KEY,
    });


    public async generateAnswerWithRag(prompt:string, context: string): Promise<string> {

        const newPrompt = `
            You are a helpful RAG assistant.
            Answer the user's question ONLY using the provided context.
            If the answer is not in context, say you don't know.
            Try to analyze every paragraph in search of an answer

            Context:
            ${context}

            Question:
            ${prompt}
        `;
        const response = await this.llm.invoke(newPrompt);
        return response.content.toString();
    }
    public async generateAnswerWithoutRag(prompt:string): Promise<string> {

        const newPrompt = `
            Question:
            ${prompt}
        `;
        const response = await this.llm.invoke(newPrompt);
        return response.content.toString();
    }

}

export const llmModel = new LLM(rag);