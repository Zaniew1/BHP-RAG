

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { DATABASE_URL } from "../utils/constants";

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

export interface StoreChunkParams {
    id?: number
    documentId:number
    content: string;
    embedding: number[];
    chunkIndex: number;
}
export interface DatabaseSelectStoreChunkParams {
    id?: number
    documentId:number
    content: string;
    chunkIndex: number;
}
interface StoreDocParams {
    id? : number
    title: string;
    content: string;
    sourcePath: string;
}

export interface VectorDBInterface{
    storeChunk(params: StoreChunkParams): Promise<number>;
    storeDoc(params: StoreDocParams): Promise<number>;
    checkDocExistance(title: string): Promise<StoreDocParams | null>;
    searchSimilarChunks(embedding: number[],  limit: number): Promise<StoreChunkParams[]>;
    cleanDatabase(): Promise<void>;
    getDocuments(): Promise<StoreDocParams[]>;
    getDocumentChunks(id: number): Promise<DatabaseSelectStoreChunkParams[]>;
    getChunks(id: number[]): Promise<DatabaseSelectStoreChunkParams[]>;
}

export class PrismaVector implements VectorDBInterface {

    async storeChunk({
        documentId,
        content,
        embedding,
        chunkIndex,
    }: StoreChunkParams) {
        const vectorString = `[${embedding.join(",")}]`;
        return prisma.$executeRawUnsafe(`
            INSERT INTO "DocumentChunk" ("documentId", "content", "chunkIndex", "embedding")
            VALUES ($1, $2, $3, $4::vector)
        `, documentId, content, chunkIndex, vectorString);
    }
    async storeDoc({
        title,
        content,
        sourcePath,
    }: StoreDocParams) : Promise<number>{
        
        const result = await prisma.$queryRaw<{ id: number }[]>`
        INSERT INTO "Document" ("title", "content", "sourcePath")
        VALUES (${title}, ${content}, ${sourcePath}) RETURNING id`;
        return result[0].id;
    }

    async searchSimilarChunks(
        embedding: number[],
        limit = 5
    ):Promise<StoreChunkParams[]> {
    const embeddingString = `[${embedding.join(",")}]`;

    return prisma.$queryRawUnsafe(`
        SELECT id, content, "documentId", "chunkIndex"
        FROM "DocumentChunk"
        ORDER BY embedding <=> '${embeddingString}'::vector
        LIMIT ${limit};
    `);
    }
    async checkDocExistance(title:string): Promise<StoreDocParams | null>{
        try{
            const existingDoc = await prisma.document.findFirst({ where: { title: title } });
            return existingDoc;
        }catch(err:any){
            throw Error('Nie udało sie checkDocExistance w bazie, problem z bazą danych')
        }
    }
    async  cleanDatabase(): Promise<void>{
        try{
            await prisma.documentChunk.deleteMany()
            await prisma.document.deleteMany()
        }catch(err:any){
            throw Error('Nie udało sie cleanDatabase w bazie, problem z bazą danych')
        }
    }
    async getDocuments(): Promise<StoreDocParams[]>{
        try{
            const documents = await prisma.document.findMany()
            return documents
         }catch(err:any){
            throw Error('Nie udało sie getDocuments w bazie, problem z bazą danych')
        }
    }
    async  getDocumentChunks(id:number): Promise<DatabaseSelectStoreChunkParams[]>{
        try{
            return prisma.documentChunk.findMany({where: {documentId:id}})
        }catch(err:any){
            throw Error('Nie udało sie getDocumentChunks w bazie, problem z bazą danych')
        }
    }
    async getChunks(id: number[]): Promise<DatabaseSelectStoreChunkParams[]>{
        try{
            return prisma.documentChunk.findMany(
                { 
                    where: {
                        id:  { in: id },
                    }       
                })
        }catch(err:any){
            throw Error('Nie udało sie getChunks w bazie, problem z bazą danych')
        }
    }
}

export class VectorDB{
    constructor(private dbInstance : VectorDBInterface){
    }
    storeChunk(params: StoreChunkParams) : Promise<number>{
        return this.dbInstance.storeChunk(params)
    }
    storeDoc(params: StoreDocParams){
        return this.dbInstance.storeDoc(params)
    }
    searchSimilarChunks(embedding: number[],  limit: number = 5): Promise<StoreChunkParams[]>{
        return this.dbInstance.searchSimilarChunks(embedding, limit)
    }
    checkDocExistance(title: string){
        return this.dbInstance.checkDocExistance(title)
    }
    cleanDatabase(): Promise<void>{
        return this.dbInstance.cleanDatabase()
    }
    getDocuments(): Promise<StoreDocParams[]>{
       return this.dbInstance.getDocuments();
    }
    getDocumentChunks(id:number): Promise<DatabaseSelectStoreChunkParams[]>{
        return this.dbInstance.getDocumentChunks(id);
    }
    getChunks(id:number[]): Promise<DatabaseSelectStoreChunkParams[]>{
        return this.dbInstance.getChunks(id);
    }
}

const prismaVector = new PrismaVector();
export const vectorDatabase = new VectorDB(prismaVector);