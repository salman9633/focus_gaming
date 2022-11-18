const mongoClient=require('mongodb').MongoClient
const state={//initially setting database null
    db:null
}

module.exports.connect=function(done){
    const url='mongodb+srv://salmanfaris:iFGHbgeqn5fW4qJA@cluster0.xc7l0ub.mongodb.net/?retryWrites=true&w=majority'
    const dbname='Gaming'//database name

    mongoClient.connect(url,(err,data)=>{//connecting database 
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
    
    

}

module.exports.get=function(){//state.db ye get lek eduth vekkunnu ini evede ee db.get() vilichaalum ee db kittum
    return state.db
}