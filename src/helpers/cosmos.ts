import { MongoClient } from 'mongodb'


export class CosmosClient {

    mongoClient: MongoClient;

    constructor(connectionString: string) {
        this.mongoClient = new MongoClient(connectionString);
    }

    public async findAll(database: string, collection: string, query: any): Promise<any> {
        const client = await this.mongoClient.connect();
        const db = client.db(database);

        let document;
        let error;

        try { document = await db.collection(collection).find(query).toArray(); }
        catch (e) { error = e; }
        finally { client.close(); }

        return { document, error };
    }

    public async findOne(database: string, collection: string, query: any): Promise<any> {
        const client = await this.mongoClient.connect();
        const db = client.db(database);

        let document;
        let error;

        try { document = await db.collection(collection).findOne(query); }
        catch (e) { error = e; }
        finally { client.close(); }

        return { document, error };
    }

    //@todo metodo foda esse aqui
    public async insertOne(database: string, collection: string, document: any): Promise<{ result: { ok?: number, n?: number }, error: any }> {
        const client = await this.mongoClient.connect();
        const db = client.db(database);

        let result: { ok?: number, n?: number } = {};
        let error: any;

        try { result = await (await db.collection(collection).insertOne(document)).result }
        catch (e) { error = e; }
        finally { client.close(); }

        return { result, error };
    }

    public async updateOne(database: string, collection: string, filter: any, query: any): Promise<any> {
        const client = await this.mongoClient.connect();
        const db = client.db(database);

        let document;
        let error;

        try { document = await db.collection(collection).updateOne(filter, query) }
        catch (e) { error = e; }
        finally { client.close(); }

        return { document, error };
    }

    public async deleteOne(database: string, collection: string, query: any): Promise<any> {
        const client = await this.mongoClient.connect();
        const db = client.db(database);

        let document;
        let error;

        try { document = await db.collection(collection).deleteOne(query) }
        catch (e) { error = e; }
        finally { client.close(); }

        return { document, error };
    }
}
