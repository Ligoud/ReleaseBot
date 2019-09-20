class Consumables
{
    constructor(){}
    async get_consume(md,cName, cons_name) //Получить результат по названию консума
    {
        /*const query={
            query:' SELECT * FROM c WHERE c.consum_name = @name',
            parameters:[
                {
                    name:'@name',
                    value:cons_name
                }
            ]    
        }*/
        const query={
            consum_name: cons_name
        }
        //const {result: res}= await container.container.items.query(query).toArray();  //COSMOS
        const res=await md.read(cName,query)
        res.forEach(element => {
            element.consum_name=element.consum_name.trim()
        });
        return res;
    }
    custom_slice(str)
    {
        if(str[str.length-1]==',') //Удаляю последнюю запятую есил она не с пробелом
            str=str.slice(0,-1)
        else if(str[0]==',')      //Или первую. И такие люди бывают
            str=str.slice(1)    

        str=str.trim()

        return str;
    }
    get_sets(words,ind)
    {
        let count=[], cons=[]   //А это можно было объединить в обж сразу
        let cObj={  //Можно было на 2 лета разбить
            consum_name:'',
            count:0
        }
        //Разбор строки (может через запятую идти 2 пачки бумаги, 5 банок клея)
        while(ind!=words.length) //До конца указывают товары
        { 
            if(typeof (+words[ind]) =="number")
            {
                cObj.count= +words[ind]
                ind++
            }else
                throw 'Неверный формат. Ожидалось увидеть Count ('+words[ind]+')'
            cObj.consum_name=''
            while(ind!=words.length && words[ind-1][words[ind-1].length-1]!=',' && words[ind][0]!=',' && words[ind]!=',') //Для перечисления  ?*********************************
            {
                cObj.consum_name+= ' '+words[ind]
                ind++;
            }
            cObj.consum_name=this.custom_slice(cObj.consum_name);
            count.push(cObj.count)
            cons.push(cObj.consum_name)
        }
        let res={
            count: count,
            cons: cons
        }
        return res;
    }
    async change_busket(action,md,cName,name,count) //Доавляем/удаляем из корзины
    {
        let addObj={
            consum_name: name,
            count: count
        }
        let returnAnsw=''
        let res=await this.get_consume(md,cName,name)   //Запрос к бд для добавляемого итема
        if(action=='add')
            if(res.length!=0){
                /*let item= basket_container.container.item(res[0].id)
                let {body: maBody}=await item.read()
                maBody.count+=addObj.count;
                await item.replace(maBody);*/
                await md.update(cName,{_id:res[0]._id},{$set:{count:res[0].count+addObj.count}})
            }else
                await md.add(cName,addObj)
                //await basket_container.container.items.create(addObj)
        else if(action=='remove'){            
            if(res.length==0)
                returnAnsw='\nЗаписи о расходнике '+name+' нет в корзине.'
            else
            {
                /*let item= basket_container.container.item(res[0].id)
                await item.delete();*/
                await md.delete(cName,{_id:res[0]._id})
            }
        }   
        return returnAnsw
    }
    parse_to_basket(action,words,ind,md,cName)//Парсим строку и обновляем корзину
    {
        const reg=/,|./
        let retrn='Записи обновлены.'
        while(ind<words.length)
        {
            let clearName=words[ind]    //Название расходника целиком
            ind++
            while(ind!=words.length && words[ind]!=',' && words[ind-1][(words[ind-1].length)-1]!=',' && words[ind][0]!=',')
            {
                clearName+=' '+words[ind]
                ind++;
            }        
            
            clearName=this.custom_slice(clearName)

            if(clearName.search(reg)!=-1){
                if(action=='add')
                    this.change_busket(action,md,cName,clearName,0)
                else if(action=='remove')                
                    retrn+=this.change_busket(action,md,cName,clearName,0)                
            }

        }
        return retrn
    }
    //Добавь 13 Ручка (дада очень смещно)
    async change_consume(action,md,cName, words,ind, optional_container='') //container - куда записываем, words - это текст юзера по словам разбитый, ind - позиция, с которой продолжать парсинг words
                                                                             //oprional_container - корзина           
    {
        let count=[], cons=[]
        let cObj={  //Просто объект для пуша в бд
            consum_name:'',
            count:0
        }
        const res=this.get_sets(words,ind);
        count=res.count;
        cons=res.cons;
        let returnAnswer='Записи обновлены.'
        //
        console.log(optional_container)
        console.info(cons.toString())
        
        if(count.length!=cons.length)
            throw 'Коамнда добавления расходников неправильно составлена.Введите /help для просмотра подробной информации'
        else{
            for(let i=0;i<count.length;i++)
            {
                let res= await this.get_consume(md,cName,cons[i])
                if(res.length==0){  //Если нет записей еще
                    if(action=='add'){
                        cObj.consum_name=cons[i]        
                        cObj.count=count[i]
                        //await container.container.items.create(cObj)
                        await md.add(cName,cObj)
                    }else if(action=='remove')
                    {
                        if(cons.length==1)
                            returnAnswer='О расходнике "'+cons[i]+'" не было найдено записей.'                        
                        else
                            returnAnswer+='\nО расходнике "'+cons[i]+'" не было найдено записей.\n'
                        cObj.consum_name=cons[i]
                        cObj.count=0
                        //await container.container.items.create(cObj)    //В любом случае добавляю запись
                        await md.add(cName,cObj)
                    }                        
                }else{
                    /*let item= container.container.item(res[0].id)
                    let {body: maBody}= await item.read()*/
                    let result=await md.read(cName,{_id:res[0]._id})
                    let maBody=res[0]
                    //console.log(maBody);
                    if(action=='add')
                        maBody.count+=count[i]
                    else if(action=='remove')
                    {
                        if(maBody.count==0)                        
                            returnAnswer+='\nСудя по всему расходника "'+ maBody.consum_name+'" нет в наличии либо не обновлены данные о нем\n'
                        else{
                            maBody.count-=count[i]
                            if(maBody.count==0){
                                returnAnswer+='\nРасходник "'+maBody.consum_name+'" был добавлен в список товаров к покупке (закончились на складе)'
                                await this.change_busket('add',md,optional_container,maBody.consum_name,0)
                            }
                        }
                    }
                    console.log('THERE IS A HUGE PROBLEm')
                    await md.replace(cName,{_id:res[0]._id},maBody);
                }
            }
        }
        return returnAnswer                    
    }
}

module.exports.Consumables=Consumables;