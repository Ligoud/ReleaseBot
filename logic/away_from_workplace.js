async function afk_logic(context,words,md) //Обработка 
{
    //await context.sendActivity('Выполняется логика афк');
    var _name=context.activity.from.name.toLocaleLowerCase(), _id=context.activity.from.id //Имя пользователя и его id (предполагаю это будет статичная информация в ms teams)
    //
    let regName=await md.read('users',{userId:_id})
    if(regName.length>0){   //имя существует
        _name=regName[0].userName
    }
    let localTimeStamp=context.activity.localTimestamp
    let hrs=localTimeStamp.getHours(), mins=localTimeStamp.getMinutes();
    //тут контейнер стоял     
    var date = localTimeStamp; //Сделать изменение UTC
    var afk={           //Когда ушел    
        date: date,
        returns: {
            value: 0,
            unit: '',
            alt: false,     //false если указывается через сколько придет (value unit) и true если конкретно время прихода (hour min)
            hour: 0,
            min: 0
        },
        person:{
            name: _name,
            id: _id
        },
        reason: words[0]
    }
    //
    function timeHere(word) //Проверка есть ли показатель времени
    {
        if(word.indexOf('мин')!=-1|| word.indexOf('час')!=-1)                            
            return true;                                
        else
            return false;
    }    
    //
    //
    const {TimeParser}=require('./timeParser');
    let parser=new TimeParser()
    var unt=2,val=2;    //Индекс единицы измерения и значения времени                
    var ok=true;
    if(words[1]=='на') //Без причины
    {
        console.log('Уходит без описания причины ухода')
        //Запоминаем время, когда он ушел. Тут год, месяц и день чисто если потом посмотреть историю
        //await context.sendActivity(words[2]);
        if (timeHere(words[2])) //Значение если сначала пишут единицу измерения
            val++;
        else if (timeHere(words[3])) //Если все же первым идет значение а потом единица
            unt++;
        else
            ok=false;
        if(ok){
        afk.returns.value=+words[val];   //Записываю всё в структуру времени возвращения
        if(words[unt].indexOf('мин')!=-1)                                
            afk.returns.unit='мин';                                                                                                        
        else
            afk.returns.unit='час';
        }
    }
    else
        ok=false;
    if(!ok){ //Указывается причина значит
        words=words.join(' ').replace('.','. ').split(' ')
        var i=1;
        var rsn=words[0]+' ';//Причина
        while(i!=words.length && words[i]!='вернусь' && words[i]!='буду')   //Причина ухода
        {     
            rsn=rsn+" "+words[i];
            i++;
        }
        afk.reason=rsn;
        if(words[i]=='вернусь'|| words[i]=='буду')
        {                        
            i++;
            if(words[i]=='через')
            {
                i++;
                unt=i; val=i;
                if(timeHere(words[i]))
                    val++;
                else if(timeHere(words[i+1]))
                    unt++;
                else
                    throw 'Ожидалось увидеть время, на которое вы отлучитесь.\nПопробуйте написать следующим образом:Буду через <Количество> <Единица измерения>';
                afk.returns.value=+words[val];   //Записываю всё в структуру времени возвращения
                if(words[unt].indexOf('мин')!=-1)                                
                    afk.returns.unit='мин';                                                                                                        
                else
                    afk.returns.unit='час';
            }
            else if(words[i]=='в')
            {
                i++;
                var timobj=parser.parseCustomTime(words[i],i);
                afk.returns.alt=true;
                afk.returns.hour=timobj.time.hours;
                afk.returns.min=timobj.time.minutes;
                //console.log('here is shit')
                if(afk.returns.hour<hrs || (afk.returns.hour==hrs && afk.returns.min<mins)){//next day 
                    //afk.date.setDate(afk.date.getDate()+1)
                    throw('Нельзя указывать на время в прошлом или на следующий день.')
                }
            }
        }
        else{
            console.log("не указал время возвращения")
            
        }
        
    }
    console.log('writing in database')
    if(Number.isNaN(afk.returns.value))
        afk.returns.value=1
    //console.log(afk);
    return afk;
}
//Формирование информации об АФКашере
function form_afk_info(obj)
{                        
    let result=''
    let localdate=new Date(obj.date);
    function correctDigit(digit)
    {
        let month=digit.toString()
        if(month.length==1)
            month='0'+month;
        return month
    }                        
    result+=obj.person.name; result=result[0].toUpperCase()+result.slice(1); //Имя с большой буквы сделал
    result+=' ушел '+correctDigit(localdate.getDate())+'.'+correctDigit((localdate.getMonth()+1))+' в '+correctDigit(localdate.getHours())+':'+correctDigit(localdate.getMinutes());
    result+='\n\nПричина ухода: '+obj.reason;
    if(obj.returns.alt){
        if(obj.returns.hour!=0 || obj.returns.min!=0)                            
            result+='\n\nДолжен вернуться '+correctDigit(localdate.getDate())+'.'+correctDigit((localdate.getMonth()+1))+' в '+correctDigit(obj.returns.hour)+':'+correctDigit(obj.returns.min);
    }
    else       
        if(obj.returns.value!=0 && obj.returns.unit!='')
        {
            if(obj.returns.unit=='мин')
                localdate.setMinutes(localdate.getMinutes()+obj.returns.value);
            else if(obj.returns.unit=='час')
                localdate.setHours(localdate.getHours()+obj.returns.value);
            result+='\n\nДолжен вернуться '+correctDigit(localdate.getDate())+'.'+correctDigit((localdate.getMonth()+1))+' в '+correctDigit(localdate.getHours())+':'+correctDigit(localdate.getMinutes());
        }
                                                    
    return result;
}  
function who_afk(words) //где имяпользователя
{
    let username=''
                  
    function get_name(id)
    {
        let myname='';
        while(myname[myname.length-1]!='?' && words[id]!='?' && id!=words.length) //Либо до конца либо до знака вопроса
        {
            myname=myname+words[id]+' ';
            id++;
        }    
        myname=myname.trim();
        if(myname[myname.length-1]=='?')
            myname=myname.slice(0,-1); //Последний символ обрубаю
        return myname;
    }
    if(words[0]=='где')                    
        username=get_name(1)                    
    else //Если был задан вопрос куда ушел или когда вернется и тп (из двух слов состоящий)                    
        username=get_name(2)   

    const query={
        'person.name': username                    
    }
    console.log(username+' kkkkk')
    return query;
}
async function get_list_of_users(md){
    let list=await md.read('users',{})
    const endd='\n\n'
    let res='Список зарегистрированных имен:'+endd
    list.forEach(el=>{        
        res+='Имя в чат-боте: '+el.userName+'. '
        res+='Имя аккаунта Teams: '+el.msName+endd         
    })
    return res
}
module.exports.afk_logic=afk_logic;
module.exports.who_afk=who_afk;
module.exports.form_afk_info=form_afk_info;
module.exports.get_list_of_users=get_list_of_users