var mysql=require('mysql');

console.log('Get connection...');

var conn = mysql.createConnection({
    database: 'bot_db',
    host: "localhost",
    user: "root",
    password: "4049",
    port: "3306"
});

console.log('--createconnection ends--')

function get_connection()
{

    conn.connect(function(err){
        try{
        if(err) throw err;
        console.log("Connected to database");}
        catch(err)
        {
            console.log('there is an error\n'+err);
        }
    });
}


////////
function request(query)
{
    //НЕЛЬЗЯ ВЫНЕСТи...
    var result=[];

    function setValue(val)
    {
        result=val;
        //console.log(result);
        console.log('was the result');
    }

    conn.query(query,function(err,results,fields)
    {
    });
    console.log(result);
    
    return result;
}

module.exports.get_connection = get_connection;
module.exports.conn=conn;
module.exports.request=request;
