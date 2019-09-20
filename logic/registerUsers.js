class User{
    constructor(){}
    async userAdd(userinfo,md,cName)
    {
        let user={
            userName: userinfo.name,
            userId: userinfo.id
        }        
        const query={
            userName: user.userName,
            userId: user.userId
        }
        let res=await md.read(cName,query)
        if(res.length==0) //Нет записиь значит
        {
            await md.add(cName,user)
        }
    }
}
module.exports.User=User;