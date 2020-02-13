const parser= require('./timeParser')

class Equipment {
    constructor(){}

    async get_equip(md,cName,words,reg){ //Индекс к массиву не нужен, так как мы с 1 будем энивей начинать, чтобы все проверить
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
        console.log(eqName+' - '+regPos)
        let cabname='',time={}
        
        if(words[regPos]==='верну'){
            console.log(words[regPos])
            regPos+=2
            time=parser.parseCustomTime(words[regPos],regPos)
        }else{
            regPos+=2
            if(words[regPos].search(/кабинет/)!=-1){
                regPos++
            }
            cabname=words[regPos]
        }
        console.log(cabname)
        console.log(time)   
        let retType=''
        if(cabname==='')
            retType='cabinet'
        else
            retType='time'
        //--------------
        let resobj={            
            returnType:retType,
            returns:{
                time: time,
                cabname: cabname
            }
        }
        await md.update(cName,{equipName:eqName},{$set:resobj})
    }
}
module.exports.Equipment=Equipment

/*
    TODO:
    *Добавить возможность добавлять новое оборудование.
        (У каждого оборудования название - это его идентификатор)
    *Добавить просмотр того, где находится оборудование
    *Ждать ответа от морозова
*/