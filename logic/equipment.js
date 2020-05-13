const {TimeParser} = require('./timeParser')
const end='\n\n'

class Equipment {
    constructor(cName){
        this.cName=cName
        this.parser=new TimeParser()
    }
    //Формирует информацию об оборудовании для пользователя. Для 1 оборудования
    async form_equip_info(single,md){    //single имеет стурктуру документа из бд (это и есть эквип)
        console.log(single)
        let formed=end+'Оборудование "'+single.equipName+'". '
        let res=await md.read('users',{userId:single.took_by})  //100% возвращает реузльтат, если только пользователь не был удален в бд или товар никто не трогал. В таком случае фиг знает что делать xDDDDD
        let name='Не определенный пользователь'
        if(res.length!=0){
            name=res[0].userName
            formed+='Последний раз было у '+name+'. '
        }
        switch(single.returnType){
            case 'cabinet':
                formed+='\nСкорее всего находится в '+single.returns.cabname+'м кабинете.'
                break
            case 'time':
                formed+=name+' обещал вернуть оборудование в '+this.parser.correctDigit(single.returns.time.time.hours)+':'+this.parser.correctDigit(single.returns.time.time.minutes)+'.'
                break
            default:
                formed+='Должно быть на складе'+end
                break
        }
        return formed
    }
    //Пользователь указывает, что взял какое-то оборудование
    async get_equip(md,took_by,words,reg){ //Индекс к массиву не нужен, так как мы с 1 будем энивей начинать, чтобы все проверить
        //Взял принтер. Верну в .../Будет в / 
        let regPos=-1
        let eqName=''
        for(let i=1;i<words.length;i++){
            if(words[i].search(reg)==-1){
                eqName+=words[i]+' '
            }else{
                regPos=i
                break
            }
        }       
        eqName=eqName.trimRight()
        if(eqName[eqName.length-1].search(/[,.-]/)!=-1)
            eqName=eqName.slice(0,-1)
        let cabname='',time={}
        
        if(words[regPos]==='верну'){    //Время
            regPos+=2
            time=this.parser.parseCustomTime(words[regPos],regPos)
        }else{  //Место
            regPos+=2
            if(words[regPos].search(/кабинет/)!=-1){
                regPos++
            }
            cabname=words[regPos]
        }
        let retType=''
        if(cabname==='')
            retType='time'
        else
            retType='cabinet'
        //--------------
        let resobj={            
            returnType:retType,
            returns:{
                time: time,
                cabname: cabname
            },
            took_by:took_by
        }
        let answer='Данные были обновлены\n\n'
        let res=await md.read(this.cName,{equipName:eqName})
        if(res.length>0)
            await md.update(this.cName,{equipName:eqName},{$set:resobj})
        else
            answer='Оборудования с таким названием не было найдено\n\n'
        
        return answer
    }

    async add_new_equip(words,md){
        let newarr=words.slice(2)   //со 2 и до конца
        let newEquips=newarr.join(' ').split(',')
        console.log(newEquips)
        let result='',extraRes=''
        for(let i=0;i<newEquips.length;i++){
            newEquips[i]=newEquips[i].trim()
            let res=await md.read(this.cName,{equipName:newEquips[i]})
            if(res.length==0)
            {
                await md.add(this.cName,{equipName:newEquips[i], returnType:'storeroom',returns:{},took_by:''})
                result='Новое оборудование было занесено в список.'
            }else{
                extraRes='\nОдно или несколько оборудований уже были зарегистрированы ранее.'
            }
        }
        result+=extraRes
        return result
    }

    async change_equip_name(words, md){ //С 3 слова начинается. 1 - комнда, 2 - уточнение. 3 - тело
        let newarr=words.slice(2)
        let pair=newarr.join(' ').split('на')
        //2 элемента будет
        pair[0]=pair[0].trim()
        pair[1]=pair[1].trim()
        //
        let asnwer='Название оборудования "'+pair[0]+'"было успешно изменено на "'+pair[1]+'"'+end
        let res=await md.read(this.cName,{equipName:pair[0]})
        if(res.length>0)
            await md.update(this.cName,{equipName:pair[0]},{$set:{equipName:pair[1]}})
        else
            asnwer='Не было найдено оборудования с названием "'+pair[0]+'".'+end
        return asnwer
    }
    async get_single_equipment_info(md,words){  //По итогу получилось так же, как и в all_equipment_info. Ну пускай отдельно будет лол.
        let k=1
        let res='Подробная информация о нахождении оборудования:'+end
        if(words[1].search(/об?/)!=-1){
            k++
        }
        let eqs=words.slice(k).join(' ').split(/,|\./)
        for(let i=0;i<eqs.length;i++){
            let el=eqs[i].trim()
            console.log(el)            
            let equip=await md.read(this.cName,{equipName:el})
            if(equip[0]){
                res+=await this.form_equip_info(equip[0],md)  
                console.log(res)
            }else{
                throw 'Кажется, ошибка в названии оборудования. Такого оборудования не найдено'
            }
        }
        return res
    }
    async get_all_equipment_info(md,words){
        let alleqs=await md.read(this.cName,{})
        let res='Список оборудований:'+end,ch=false
        if(words.length>3 && words[3].search(/подробн/)!=-1)
            ch=true
        
        for(let i=0;i<alleqs.length;i++){
            if(ch){
                res+=await this.form_equip_info(alleqs[i],md)                                
            }else
                res+='1) '+alleqs[i].equipName+'\n'
        }
        return res
    }
    //Вернул <equip>,...,<equipN> [на место][в [кабинет NUM][кладовку]]
    //на место = в кладовку = ничего не указывать
    async return_equipment(md,words){
        let newarr=words.slice(1) //Отрезаю слово 'Вернул'
        let reteqs=newarr.join(' ')
        const reg=/на|в/
        let na=reteqs.search(reg)
        let newplace='storeroom', roomname=-1, eqs={}
        if(na!=-1){ //Значит есть куда возвращать.
            let spl=reteqs.split(reg)
            let place=spl[1].trim().split(' ')
            eqs=spl[0]
            if(place[0].search('каб')!=-1 && !Number.isNaN(+place[1])){
                newplace='cabinet'
                roomname=+place[1]
            }
        }else{
            eqs=reteqs
        }
        eqs=eqs.split(/,|\.|и/)
        eqs.forEach(async el=>{
            el=el.trim()
            let res=await md.read(this.cName,{equipName:el})
            if(res.length>0)
                await md.update(this.cName,{equipName:el},{$set:{returnType:newplace, returns:{cabname:roomname}}})
        })
       
        return 'Данные были обновлены'
    }//////НЕ ОБНОВЛЯЕТ НИЧЕГО В БД. ПОСМОТРЕТЬ
}
module.exports.Equipment=Equipment

/*
    TODO:
    *Добавить возможность добавлять новое оборудование.[V]
        (У каждого оборудования название - это его идентификатор)
    *Добавить просмотр того, где находится оборудование [+-]
    *Ждать ответа от Морозова
*/

/*
    17.02 TODO:
    В формирование добавить разные варианты в зависимости от текущего времени. Тип если оборудование уже должно было освободиться [ ]
    110 строка бота список  [V]
*/