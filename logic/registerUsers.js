class User{
    constructor(){}
    async userAdd(userinfo,md,cName,nickName='')
    {
        //KEK я продублировал объекты хз зачем xD Мб сос мыслом, потом вспомню мб
        let uname=nickName===''?userinfo.name:nickName
        uname=uname.toLocaleLowerCase()
        
        let user={
            userName: uname,
            msName: userinfo.name,
            userId: userinfo.id
        }        
        const query={
//            userName: user.userName,
            userId: user.userId
        }
        let answ=''
        let res=await md.read(cName,query)  //Зареган уже?
        if(res.length==0) //Нет записиь значит
        {
            await md.add(cName,user)
            answ='Вы были зарегистрированы как '+uname
        }else{ //Если был
            await md.update(cName,query,{$set:{userName: uname}})
            answ='Вы были перезаписаны как '+uname
        }
        return answ
    }
}
module.exports.User=User;