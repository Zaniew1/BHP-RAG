import { DocumentLoadInterface, loader,  LoaderInterface} from "./loader.service"
import {EmbeddedChunk, embedding,  EmbeddingModelInterface } from "./embedding.service";
import {VectorDBInterface, StoreChunkParams, vectorDatabase } from '../services/vector.service'
export interface RagInterface{
    augmentPrompt(prompt: string): Promise<string>
    ingestDocuments(folderPath:string): Promise<void> 
}

class RAG implements RagInterface{
    private readonly CHUNK_SIZE = 1000; 
    private readonly OVERLAP = 150;  
    constructor(private embeddModel: EmbeddingModelInterface, private vectorDb:VectorDBInterface, private docsLoader:LoaderInterface){}
    public async  ingestDocuments(folderPath:string): Promise<void> {
        try{
            const documentsText = await this.loadDocuments(folderPath);
            const documentsTextWithChunks =  this.chunkDocuments(documentsText);
            const documentsTextWithEmbeddedChunks = await this.embeddDocuments(documentsTextWithChunks);
            await this.storeInVectorDb(documentsTextWithEmbeddedChunks);
        }catch(e){
            throw Error('Nie udało się')
        }
    }
    public async augmentPrompt(prompt: string): Promise<string> {
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
    private async loadDocuments(folderPath:string): Promise<DocumentLoadInterface[]> {
        return await this.docsLoader.parseDocuments(folderPath)
    }
    private chunkDocuments(docs: DocumentLoadInterface[]): DocumentLoadInterface[] {
        return docs.map(doc => {
            const words = doc.content.split(/\s+/).filter(Boolean);

            const chunkSize = this.CHUNK_SIZE;
            const overlap = this.OVERLAP;

            if (chunkSize <= overlap) {
                throw new Error("CHUNK_SIZE must be greater than OVERLAP");
            }

            const chunks: EmbeddedChunk[] = [];

            let start = 0;
            while (start < words.length) {
                const end = Math.min(start + chunkSize, words.length);
                const chunk = words.slice(start, end).join(" ");
                chunks.push({
                    content: chunk,
                    vector: []
                });
                start += chunkSize - overlap;
            }
            return {
                ...doc,
                chunks
            };
        });
    }
   private async embeddDocuments(docs: DocumentLoadInterface[]): Promise<DocumentLoadInterface[]> {
        for (const doc of docs) {
            if (!doc.chunks) continue;
            for (const singleChunk of doc.chunks) {
                singleChunk.vector = await this.embeddModel.embedText(singleChunk.content);
            }
        }
        return docs;
    }
    private async storeInVectorDb(documents: DocumentLoadInterface[]): Promise<void> {
        // zapis wszystkich dokumentów do bazy
        await Promise.all(
            documents.map(async (doc) => {
                // zapis dokumentu głównego
                const existingDocument = await this.vectorDb.checkDocExistance(doc.title);
                if(existingDocument) return;
                const docId = await this.vectorDb.storeDoc({
                    title: doc.title,
                    content: doc.content,
                    sourcePath: doc.source,
                });
                // zapis chunków powiązanych z dokumentem
                if (doc.chunks?.length) {
                    await Promise.all(
                        doc.chunks.map(async (singleChunk, index) => {
                            await this.vectorDb.storeChunk({
                                documentId: docId,
                                content: singleChunk.content,
                                embedding: singleChunk.vector,
                                chunkIndex: index
                            });
                        })
                    );
                }
            })
        );
    }
       
}

export const rag = new RAG(embedding, vectorDatabase, loader);