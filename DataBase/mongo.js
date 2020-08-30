const MongoClient = require('mongodb').MongoClient;
const uri = ''; //HERE IS YOU URI;
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect()

class Mongo{
    constructor(db){
        this.dbname=db
    }

    async createIfNotExists(colName)      //Создает коллекцию, если ее не было
    {
        try{
            await client.db(this.dbname).createCollection(colName)
        }
        catch(err){}
    }
    async add(colName,item) //Кладет 1 итем
    {        
        await this.createIfNotExists(colName)
        const col=client.db(this.dbname).collection(colName)
        await col.insertOne(item)    
    }
    async read(colName,query)   //Массив возвращает
    {
        await this.createIfNotExists(colName)
        const col= client.db(this.dbname).collection(colName)
        const res=await col.find(query).toArray();   
        return res
    }
    async delete(colName,filter)
    {
        await this.createIfNotExists(colName)
        const col=client.db(this.dbname).collection(colName)
        await col.deleteOne(filter)
    }
    async update(colName,idObj,updFilter){
        await this.createIfNotExists(colName)
        const col=client.db(this.dbname).collection(colName)
        await col.updateOne(idObj,updFilter)
    }
    async replace(colName,filter,repObj)
    {
        await this.createIfNotExists(colName)
        const col=client.db(this.dbname).collection(colName)
        await col.replaceOne(filter,repObj)
    }
}
module.exports.Mongo=Mongo;
