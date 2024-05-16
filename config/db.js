const {MongoClient, Objectid} = require(mongodb);
process.loadEnvFile('./.env')

const connectDb = async () => {
    try{client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    const db = client.db(process.env.DB_NAME)
    console.log(`Connected to Database`);
    return db;
    }catch (err){
         console.log(`Error connecting to database ${err}`);
    }
}

export default connectDb;