const options = require("../config/dbConfig");
const knex = require("knex");

const dbmysql = knex(options.mariaDB);
const dbSqlite = knex(options.sqliteDB);

const createTables = async()=>{
    try {

        const tableProductsExists = await dbmysql.schema.hasTable("products");
        if(tableProductsExists){
            await dbmysql.schema.dropTable("products")
        }
        await dbmysql.schema.createTable("products",table=>{

            table.increments("id");
            table.string("title",40).nullable(false);
            table.integer("price");
            table.string("thumbnail",100);
        });
        console.log("table products created successfully");
        dbmysql.destroy();

        const tableChatExists = await dbSqlite.schema.hasTable("chat");
        if(tableChatExists){
            await dbSqlite.schema.dropTable("chat")
        }
        await dbSqlite.schema.createTable("chat", table=>{

            table.increments("id");
            table.string("user",30);
            table.string("timestamp", 10);
            table.string("message",200);
        });
        console.log("chat table created");
        dbSqlite.destroy();
    } catch (error) {
        console.log(error)
    }
}

createTables();