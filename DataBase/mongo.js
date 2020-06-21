const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGO_URL? process.env.MONGO_URL : "mongodb+srv://user:userIndeed@offsmngrbot-yfbnk.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
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
    async addOrUpdate(colname,filter,item)
    {
        await this.createIfNotExists(colname)
        let res1=await this.read(colname,filter)
        let result={}
        if(res1.length!=0){
            await this.update(colname,filter,{$set:item})
        }else{
            await this.add(colname,item)
        }
    }
    async getRandomDocument(colName,filter)
    {        
        let res=await this.read(colName,filter)
        let ind=Math.floor(Math.random() * res.length)
        let item=res[ind]
       // console.log(item)
        return item
    }
}
module.exports.Mongo=Mongo;
