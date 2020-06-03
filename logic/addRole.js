class Role
{
    constructor()
    {
    }
    
    async addRole(words,ind,md,cName) {
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
        let check=false;
        for(var i=0;i<splitted.length;i++)
        {
            if(splitted[i]!='')
            {
                //query.parameters[0].value=splitted[i];    //cosmos
                query['name']=splitted[i]
                
                let res=await md.read(cName,query)
                if(res.length>0) //Если запись есть об этом пользователе - добавить роль
                {
                    if(res[0].roles.indexOf(role)==-1){                    
                        let item=await md.read(cName,{_id:res[0]._id})
                        let mabody=item[0]
                        mabody.roles.push(role);
                        check=true;
                        console.log('Replacing role for '+splitted[i]);
                    }
                    else
                        console.log('Already added. No need to add role again');
                }
                else
                {
                    var roleInfo={
                        name:'',
                        roles:[]
                    }
                    roleInfo.roles.push(role);
                    roleInfo.name=splitted[i]; 
                    console.log('Writing role for '+splitted[i])                               
                   // await container.container.items.create(roleInfo);
                    md.add(cName,roleInfo)
                    check=true;
                }
            }
        }
        return check
    }
    async getRole(username,md,cName)
    {
        const query={
            name: username
        }
        
        let res=await md.read(cName,query)
        if(res[0]==undefined)
            return ''
        else
            return res[0].roles;
    }
}
module.exports.Role=Role;