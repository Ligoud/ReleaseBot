class User{
    constructor(){}
    async userAdd(userinfo,md,cName,nickName='')
    {
        //KEK я продублировал объекты хз зачем xD Мб сос мыслом, потом вспомню мб
        let user={
            userName: userinfo.name,
            userId: userinfo.id
        }        
        const query={
//            userName: user.userName,
            userId: user.userId
        }
        let answ=''
        let res=await md.read(cName,query)
        if(res.length==0) //Нет записиь значит
        {
            await md.add(cName,user)
            answ='Вы были зарегистрированы как '+user.userName
        }else if(nickName!=''){
            await md.update(cName,query,{$set:{userName: nickName}})
            answ='Вы были перезаписаны как '+nickName
        }
        return answ
    }
}
module.exports.User=User;