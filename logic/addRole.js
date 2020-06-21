class Role
{
    constructor(cName)
    {
        this.cName=cName
        this.endd='\n\n'
    }
    
    async addRole(words,ind,md) {
        ind++;
        let role=words[ind]; //Название роли в одно слово
        console.log(role)
        let names_for_role='';
        ind++;
        while(ind!=words.length)
        {
            names_for_role+=words[ind];                        
            ind++;
            if(ind!=words.length)
            names_for_role+=' '
        }
        let cReg=/\s|,/
        let splitted=names_for_role.split(cReg); //Имена для ролей                   
        
        const query={
            name: ''
        }
        //Это сама запись xD (Подсчёт выше идет, если это можно назвать подсчётом)
        //
        let answer=false;
        //Перебираю имена
        for(var i=0;i<splitted.length;i++)
        {
            let regname=await md.read('users',{userName:splitted[i]})
            if(regname.length>0){
                if(splitted[i]!='')
                {
                    //query.parameters[0].value=splitted[i];    //cosmos
                    query['name']=splitted[i]
                    
                    let res=await md.read(this.cName,query)
                    if(res.length>0) //Если запись есть об этом пользователе - добавить роль
                    {
                        //Если записи о данной роли нет
                        if(res[0].roles.indexOf(role)==-1){                    
                            let item=await md.read(this.cName,{_id:res[0]._id})
                            let mabody=item[0]
                            mabody.roles.push(role);
                            //тут, кажется, обновить нужно!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                            console.log('Обновление роли для '+splitted[i]);
                        }
                        else
                            console.log('Роль уже добавлена. Нет нужды добавлять ее повторно');
                        answer='Роли были добавлены'
                    }
                    else
                    {
                        var roleInfo={
                            name:regname[0].userName,
                            userid:regname[0].userId,
                            roles:[]
                        }
                        roleInfo.roles.push(role);
                        console.log('Writing role for '+splitted[i])                               
                    // await container.container.items.create(roleInfo);
                        md.add(this.cName,roleInfo)
                        answer='Роли были добавлены'
                    }
                }
            }else{
                throw 'Пользователь с именем "'+splitted[i]+'" не был зарегистрирован. Для дополнительной информации введите /help'
            }
        }
        return answer
    }
    //Получить все роли по id пользователя
    async getRole(uid,md)
    {
        const query={
            userId: uid
        }
        
        let res=await md.read(this.cName,query)
        if(res[0]==undefined)
            return ''
        else
            return res[0].roles;
    }
    async getListOfRoles(md){
        let res=await md.read(this.cName,{})
        
        let answer='Список пользователей с особыми ролями:'+this.endd
        if(res.length>0){        
            res.forEach(el=>{
                answer+='Имя: '+el.name+'. Роли: '
                el.roles.forEach(rl=>{
                    answer+=rl+', '
                })
                answer=answer.slice(0,-2)   //Лишнюю запятую стираю
                answer+=this.endd
            })
        }else{
            answer='Ни у кого нет особых ролей'+this.endd
        }
        return answer
    }
}
module.exports.Role=Role;