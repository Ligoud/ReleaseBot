function afk_logic(context,words) //Обработка 
{
    //await context.sendActivity('Выполняется логика афк');
    var _name=context.activity.from.name.toLocaleLowerCase(), _id=context.activity.from.id //Имя пользователя и его id (предполагаю это будет статичная информация в ms teams)
    //тут контейнер стоял     
    var date = new Date(); //Сделать изменение UTC
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
    const timeParse=require('./timeParser');
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
                var timobj=timeParse.parseCustomTime(words[i],i);
                afk.returns.alt=true;
                afk.returns.hour=timobj.time.hours;
                afk.returns.min=timobj.time.minutes;
            }
        }
        else{
            console.log("не указал время возвращения")
        }
        
    }
    console.log('writing in database')
    //console.log(afk);
    return afk;
}
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
    result+='\nПричина ухода: '+obj.reason;
    if(obj.returns.alt){
        if(obj.returns.hour!=0 || obj.returns.min!=0)                            
            result+='\nДолжен вернуться '+correctDigit(localdate.getDate())+'.'+correctDigit((localdate.getMonth()+1))+' в '+correctDigit(obj.returns.hour)+':'+correctDigit(obj.returns.min);
    }
    else       
        if(obj.returns.value!=0 && obj.returns.unit!='')
        {
            if(obj.returns.unit=='мин')
                localdate.setMinutes(localdate.getMinutes()+obj.returns.value);
            else if(obj.returns.unit=='час')
                localdate.setHours(localdate.getHours()+obj.returns.value);
            result+='\nДолжен вернуться '+correctDigit(localdate.getDate())+'.'+correctDigit((localdate.getMonth()+1))+' в '+correctDigit(localdate.getHours())+':'+correctDigit(localdate.getMinutes());
        }
                                                    
    return result;
}  
function who_afk(words)
{
    let username=''
                  
    function get_name(id)
    {
        let myname='';
        while(myname[myname.length-1]!='?' && words[id]!='?' && id!=words.length) //Либо до конца либо до знака вопроса
        {
            myname=myname+words[id];
            id++;
        }
        if(myname[myname.length-1]=='?')
            myname.slice(0,-1); //Последний символ обрубаю
        return myname;
    }
    if(words[0]=='где')                    
        username=get_name(1)                    
    else //Если был задан вопрос куда ушел или когда вернется и тп (из двух слов состоящий)                    
        username=get_name(2)   
        //cosmosquery
    /*const query={
        query:"SELECT * FROM c WHERE c.person.name = @username",
        parameters: [
            {
                name: "@username",
                value: username
            }
        ]
    }*/
    const query={
        'person.name': username                    
    }
    return query;
}
module.exports.afk_logic=afk_logic;
module.exports.who_afk=who_afk;
module.exports.form_afk_info=form_afk_info;