const {TimeParser} = require('./timeParser')

class Meeting{
    constructor(){
        this.parser=new TimeParser()
        this.cName='meeting'
    }
    trim_special(str,regStart,regEnd=''){
        if(regEnd=='')
            regEnd=regStart
        if(str[0].search(regStart)!=-1)
            str=str.slice(1)
        if(str[str.length-1].search(regEnd)!=-1)
            str=str.slice(0,-1)
        return str
    }
    skip_till_theme(words,i){
        while(words[i].search(/совещан/)==-1){
            i++
        }
        i++
        if(words[i].search(/[-:,]/)!=-1)
            i++
        return i
    }
    async add_theme(md,words,additional_date=''){        
        let theme='',date={}
        let answ=''
        if(words[1].search(/тем/)!=-1){
            let i=1
            i=this.skip_till_theme(words,i)
            let newarr=words.slice(i)  //если нет для совещания, то будет 2
            if(newarr.includes('на')){
                let theme_date=newarr.join(' ').split('на')
                theme=theme_date[0].trim()
                date=this.parser.parseCustomDate(theme_date[1],1)                
            }else{
                theme=newarr.join(' ').trim()
                date=this.parser.parse_timestamp(additional_date)   //тут timestampz надо изменить
            }
            theme=this.trim_special(theme,/["'<]/,/["'>]/)
            await md.add(this.cName,{type:'casual',theme: theme,date: date})
        }
        answ='Информация была записана'
        return answ
    }
    async get_themes(md,words,additional_date='',offset=0){ //офсет - место, с которого начинается название темы. По дефолту это 2 индекс. Ондако если 'покажи список тем для совещаний'
        let reg=/за|на/
        let newarr=words.slice(2+offset)
        let sdate={}   //search date
        if(newarr.includes('на') || newarr.includes('за')){
            sdate=newarr.join(' ').split(reg)
            sdate=sdate[1].trim()
            sdate=this.parser.parseCustomDate(sdate,1)
        }else{
            sdate=this.parser.parse_timestamp(additional_date)
        }
        let result=await md.read(this.cName,{type:'casual',date:sdate})
        //FORM LIST
        let answ='Список тем для совещания:\n'
        result.forEach(el => {
            answ+='1) '+el.theme+'\n' 
        })
        result=await md.read(this.cName,{type:'main',date:sdate})
        if(result.length>0 && result[0].theme!='')
            answ+='\n\nОсновная тема совещания: "'+result[0].theme+'"\n'
        else
            asnw+='\n\nОсновная темя совещания еще не назначена\n'
        return answ
    }
    async set_main_theme(md,words,additional_date=''){
        let i=2
        i=this.skip_till_theme(words,i)
        let newarr=words.slice(i)
        let theme='',date=''
        if(newarr.includes('на')){  //это дата
            let pair=newarr.join(' ').split('на')
            theme=pair[0]
            date=pair[1]
            date=this.parser.parseCustomDate(date,0)
        }else{
            theme=newarr.join(' ')
            date=this.parser.parse_timestamp(additional_date)
        }
        theme=this.trim_special(theme,/["'<]/,/["'>]/)
        //await md.update(this.cName,{date:date},{$set:{mainTheme:theme,date:date})   // <--- create or replace
        await md.addOrUpdate(this.cName,{type:'main',date:date},{type:'main',theme:theme,date:date})
        return 'Основная тема для совещания установлена'
    }
}

module.exports.Meeting=Meeting


/*
    TODO:   [ ]
Сделать проверку на уровне конструкторов в классах , где используется таймпарсер сделать проверку
чтобы задним числом не добавлялось что-то в бд. (передавать в конструкторе дату)
*/

/*
    TODO:
    Добавить в монго addOrReplace() [OK]
    Темы сделать следующим образом {type:'main'/'casual', theme:<>, date:<>} [OK]
    Добавить инициализацию пользователя (Зарегистрируй меня [как ...]) Если имя не указано - как он зареган в мс тимс   [ ]
 */