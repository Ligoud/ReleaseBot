const parseTime=require('./timeParser');
class cabs
{
    constructor()
    {
        this.room_reg=/кабинет|комнат/;
        this.error_message='Не хватает данных для обработки. Все доступные команды можно посмотреть, отправив команду /help'
    }
    
    handle_room_keyword(words,ind) //Ищет название кабинета
    {        
        if(words[ind].search(this.room_reg)!=-1) // Тип название кабинета   
            return words[ind+1];            
        else if(words[ind+1].search(this.room_reg)!=-1)            
            return words[ind]
        else
            throw 'Не могу распознать команду. Для помощи напишите /help'
    }
    correctDigit(digit)
    {
        let month=digit.toString()
        if(month.length==1)
            month='0'+month;
        return month
    } 
    form_reserved_answer(list,local_cabname=''){
        function sort_alg()
        {
            return (a,b)=>{
                if(a.time.begins.hours<b.time.begins.hours)
                    return -1;
                else if(a.time.begins.hours>b.time.begins.hours)
                    return 1;
                else
                {
                    if(a.time.begins.minutes<b.time.begins.minutes)
                        return -1;
                    else
                        return 1;
                }
            }
        }
        list.sort(sort_alg());
        var result_info=''
        if(local_cabname=='')
            result_info='Список забронированных кабиентов на '+list[0].date.day+'.'+list[0].date.month+'.'+list[0].date.year+':';
        else 
            result_info='Время брони кабинета '+local_cabname+' на '+list[0].date.day+'.'+list[0].date.month+'.'+list[0].date.year+':'
        list.forEach(el => {
            let begMin=el.time.begins.minutes
            if(begMin==0)
                begMin='00'
            let endMin=el.time.ends.minutes
            if(endMin==0)
                endMin='00'
            result_info+='\n* Кабинет '+el.cab_name+' забронирован с '+el.time.begins.hours+':'+begMin+' до '+el.time.ends.hours+':'+endMin;
        });
        return result_info;
    }
    async show_reserved_list(customDate,localDate,local_cabname,midTime,md,cName) //Индекс указывает на дату / либо ее отстутствие //CustomDate - то, что было в сообщении. Local - та, которая в сообщении
    {                                                                              //midTime - еще один опциональный параметр. Нужен для более точной выборки. '' если нет времени
        const query={
            'date.day':0,
            'date.month':0,
            'date.year':0
        }
        if(local_cabname!='')
        {
            query['cab_name']=local_cabname;
        }
        if(midTime!='')
        {
            console.log('kek',midTime)

            query['time.begins.hours']={$lte: midTime.time.hours}
            query['time.ends.hours']={$gte: midTime.time.hours}
        }
        //console.log('customdate in a fucntion', customDate)
        if(customDate=='')
        {
            query['date.day']=localDate.getDate()
            query['date.month']=localDate.getMonth()+1
            query['date.year']=localDate.getFullYear()
        }
        else{
            //console.log('here?')
            let obj=parseTime.parseCustomDate(customDate,0);
            query['date.day']=obj.day
            query['date.month']=obj.month
            query['date.year']=obj.year
        }
        const list=await md.read(cName,query);
        //console.log(list);
        
        var resObj={
            list: list,
            resInfo:''
        };
        if(list.length==0){        
            resObj.resInfo= 'На '+query['date.day']+'.'+query['date.month']+'.'+query['date.year']+' нет забронированных кабинетов'
        }
        else{
            //console.log('Длина :',list.length);
            resObj.resInfo= this.form_reserved_answer(list,local_cabname);
        }
        return resObj
    }

    //
    //Пример: удали бронь кабинета 112 в 13.00  (удаляет бронь кабинета 112 , которая начинается до 13 и заканчивается после (включительно))
    async remove_reserv(md,cName,words,ind,localDate,reserved_by)
    {
        
        let k=ind+1;
        const local_reg=/кабинет|комнат/
        while(k!=words.length && words[k-1].search(local_reg)==-1) //Скипаю все слова до нужного (номера кабинета)
            k++;
        let cab_name='' //Название кабинета
        if(k!=words.length){ 
            cab_name=words[k];
            k++;
        }else{}//тут надо ошибку еще тровать какуют
        let customDate='',customTime=''
        if(k!=words.length){ //Время брони (у одного кабинета может быть несколько броней)
            k++                 //тут предлог скипаю (между номером кабинета и временем)
            customTime=words[k];
            k++;
        }else{}
        if(k!=words.length){  //Дата (если нет - сегодняшний день)
            customDate=words[k];
            k++
        }else{}
        
        var timeobj=parseTime.parseCustomTime(customTime)
        let res=await this.show_reserved_list(customDate,localDate,cab_name,timeobj,md,cName); //res.list - результат запроса
        if(res.list.length==0){            
            return 'По вашему запросу не найдено брони'
        }
        else if(res.list[0].reserved_by==reserved_by){console.log("ЗАДОЛБАЛО")           
            await md.delete(cName,{_id:res.list[0]._id})
            return 'Запись удалена'
        }else{
            return 'Удалять бронь может только тот, кто ее сделал ('+res.list[0].reserved_by+')'
        }
    }

    async add_reserv(md,cName,words,sender,localDate) //Тут обработка всей фразы после слова 'забронируй'. Мб свич на кабинет-оборудования добавить тут стоит
    {
        var ind=1;

        if(words.length==1)
            throw this.error_message
        else
        {
            let res={
                cab_name:'',
                time:{
                    begins:{
                        hours:0,
                        minutes:0
                    },
                    ends:{
                        hours:0,
                        minutes:0
                    }
                },
                date:{
                    day:0,
                    month:0,
                    year:0
                },
                reserved_by:sender
            }
            
            var cabinet_name=this.handle_room_keyword(words,ind);

            console.log(cabinet_name);  
            res.cab_name=cabinet_name;
            ind+=2; //следующая за названием кабинета фраза         
            if(words[ind]=='с') //Формат 'с time до time'
            {
                ind++;
                const timeStart=parseTime.parseCustomTime(words[ind],ind);
                ind=timeStart.offset; 
                if(words[ind]!='до')
                    throw 'Ожидалось увидеть конструкцию c Время до Время Дата. Для дополнительной информации отправьте /help'
                ind++; //Пропускаю до
                const timeEnd=parseTime.parseCustomTime(words[ind],ind);
                ind=timeEnd.offset;
                if(words[ind]!=undefined)
                {
                    const date=parseTime.parseCustomDate(words[ind],ind);
                    res.date=date;
                }
                else
                {
                    res.date.day=localDate.getDate()
                    res.date.month=localDate.getMonth()+1
                    res.date.year=localDate.getFullYear()
                }                    
                res.time.begins=timeStart.time;
                res.time.ends=timeEnd.time;
                //Проверка на правильность написания времени брони
                let preDeclineMsg='Бронировать кабинет можно только на текущий день (время начала должно быть меньше времени окончания брони)'
                if(res.time.begins.hours<0 || res.time.begins.hours>23 || res.time.ends.hours<0 || res.time.ends.hours>23)
                    return 'Количество часов должно быть в промежутке от 0 до 23'
                else if(res.time.begins.minutes<0 || res.time.begins.minutes>59 || res.time.ends.minutes<0 || res.time.ends.minutes>59)
                    return 'Количество минут должно быть в промежутке от 0 до 59'
                else if(res.time.begins.hours>res.time.ends.hours)
                    return preDeclineMsg
                else if(res.time.begins.hours==res.time.ends.hours && res.time.begins.minutes>=res.time.ends.minutes)
                    return preDeclineMsg
                //
                //Проверка на то, занято ли время брони или нет
                const tempDate=res.date.day+'.'+res.date.month+'.'+res.date.year //Проверку сделать
                let req1=await this.show_reserved_list(tempDate,'',res.cab_name,timeStart,md,cName) 
                let req2=await this.show_reserved_list(tempDate,'',res.cab_name,timeEnd,md,cName) 
                let answer=''
                if(req1.list.length!=0){ //Если =0 то нет конфликтных моментов
                    console.log('here req1')
                    let declineMsg='На данный промежуток времени этот кабинет уже забронирован!'
                    if(req1.list[0].time.ends.hours==res.time.begins.hours && req1.list[0].time.ends.minutes>res.time.begins.minutes)                
                        answer=declineMsg                
                    else if(req1.list[0].time.ends.hours!=res.time.begins.hours)
                        answer=declineMsg
                }
                if(req2.list.length!=0){
                    console.log('here req2')
                    let declineMsg='Данный кабинет не может быть забронирован на такой длительный промежуток времени!' 
                    if(req2.list[0].time.begins.hours==res.time.ends.hours && req2.list[0].time.begins.minutes<res.time.ends.minutes)
                        answer=declineMsg
                    else if(req2.list[0].time.begins.hours!=res.time.ends.hours)
                        answer=declineMsg
                }
                if(answer==''){ //Если нет условий, который мешают добавлению брони
                    //container.container.items.create(res);    //Cosmos
                    //console.log('?????')
                    await md.add(cName,res)
                    answer='Ваша бронь успешно добавлена!'
                }
                return answer;
            }
            else{
                return 'Неверная конструкция. Отправьте /help для помощи'
            }
        }        
    }
}

module.exports.cabs=cabs;