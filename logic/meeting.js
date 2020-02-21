const {TimeParser} = require('./timeParser')

class Meeting{
    constructor(){
        this.parser=new TimeParser()
        this.cName='meeting'
    }

    async add_theme(md,words,additional_date=''){        
        let theme='',date={}
        let answ=''
        if(words[1].search(/тем/)!=-1){
            let newarr = words.slice(2)
            console.log(newarr)
            if(newarr.includes('на')){
                let theme_date=newarr.join(' ').split('на')
                theme=theme_date[0].trim()
                date=this.parser.parseCustomDate(theme_date[1],1)                
            }else{
                theme=newarr.join(' ').trim()
                date=this.parser.parse_timestamp(additional_date)   //тут timestampz надо изменить
            }
            console.log(theme)
            console.log(date)
            await md.add(this.cName,{theme: theme,date: date})
        }
        answ='Информация была записана'
        return answ
    }
    async get_themes(md,words,additional_date=''){
        let reg=/за|на/
        let newarr=words.slice(2)
        let sdate={}   //search date
        if(newarr.includes('на') || newarr.includes('за')){
            sdate=newarr.join(' ').split(reg)
            sdate=sdate[1].trim()
            sdate=this.parser.parseCustomDate(sdate,1)
        }else{
            sdate=this.parser.parse_timestamp(additional_date)
        }
        console.log(sdate)
        let result=await md.read(this.cName,{date:sdate})
        console.log(result)
        //FORM LIST
        let answ='Список тем для совещания:\n'
        result.forEach(el => {
            answ+='1) '+el.theme  
        })
        return answ
    }
}

module.exports.Meeting=Meeting


/*
    TODO:
Сделать проверку на уровне конструкторов в классах , где используется таймпарсер сделать проверку
чтобы задним числом не добавлялось что-то в бд. (передавать в конструкторе дату)
*/