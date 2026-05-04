import fs from 'fs/promises'
import path from "path";
import pdf from 'pdf-parse';
import { EmbeddedChunk } from './embedding.service';

export interface LoaderInterface {
    parseDocuments(folderPath:string):Promise<DocumentLoadInterface[]>
}

export interface DocumentLoadInterface{
    title:string, 
    source:string, 
    content: string
    chunks?: EmbeddedChunk[]
}

export class Loader implements LoaderInterface{
    constructor(){}
    public async parseDocuments(folderPath:string): Promise<DocumentLoadInterface[]> {
        const files = await fs.readdir(folderPath);

        const results: DocumentLoadInterface[] = [];
        for (const file of files) {
            const fullPath = path.join(folderPath, file);
            const ext = path.extname(file).toLowerCase();

            try {
                if (ext === ".txt") {
                    const content = await this.parseText(fullPath);
                    results.push({title:file, content, source:fullPath});
                }

                if (ext === ".md") {
                    const content = await this.parseMd(fullPath);
                    results.push({title:file, content, source:fullPath});
                }

                if (ext === ".pdf") {
                    const content =  await this.parsePDF(fullPath)
                    results.push({title:file, content, source:fullPath});
                }
            } catch (err) {
                console.error(`Failed to parse ${file}:`, err);
            }
        }
        return results;
    }
    private async parsePDF(filePath: string): Promise<string>  {
        try {
            const buffer = await fs.readFile(filePath);
            const result = await pdf(buffer);
            return result.text;
        }
        catch(e: unknown){throw Error("BŁAD")}
    }
    private async parseText(filePath: string): Promise<string> {
        const content = await fs.readFile(filePath, "utf-8");

        if (!content.trim()) {
            throw new Error("TXT file is empty");
        }

        return content;
    }
    private async parseMd(filePath: string): Promise<string> {
        const content = await fs.readFile(filePath, "utf-8");
        if (!content.trim()) {
            throw new Error("Markdown file is empty");
        }
        return content
            .replace(/```[\s\S]*?```/g, "") // code blocks
            .replace(/`([^`]+)`/g, "$1") // inline code
            .replace(/!\[.*?\]\(.*?\)/g, "") // images
            .replace(/\[([^\]]+)\]\((.*?)\)/g, "$1") // links
            .replace(/^#{1,6}\s+/gm, "") // headings
            .replace(/[*_~>-]/g, "") // markdown chars
            .replace(/\n{2,}/g, "\n")
            .trim();
        }

}

export const loader = new Loader();