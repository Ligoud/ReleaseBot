var reg=/-|:|\./g 
function parseCustomTime(time,ind) //Время считывает. Тип 12 30 //time это words
    {
        var newtime={
            time:{
                hours: 0,
                minutes: 0
            },
            offset:0
        };
        var k=ind;
        var restr=time; //Время в одну строку без пробелов должно идти
        /*while(k<time.length && time[k]!='до'){   //Всё в одну строку
            restr=restr+time[k]+" " 
            k++
        }*/console.info(restr);
        console.log('===')
        newtime.offset=ind+1;
        //вся дата в одно слово уместилось( 12/ 12.30/ 12:30)
            const errorMsg='Ожидалось увидеть время в формате Hours.Munutes'
            var c=restr.split(reg)
            
            console.log('-------');
            if(c.length>0)
            {                
                c.forEach(el => {
                    if(isNaN(+el))
                        throw errorMsg;
                });
                newtime.time.hours= +c[0]
                
                if(c.length>1)
                    newtime.time.minutes= +c[1]
                else
                    newtime.time.minutes=0
            }
            else{ //Ошибка не срабатывает. Поправить потом
                console.log('выкидывает все-таки')
                throw errorMsg
            }
        return newtime;                        
    }
function parseCustomDate(customDate,ind) //Аналог parseCustomTime только для даты . ind указывает на дату
{
    var date={
        day: 0,
        month: 0,
        year:0,
    };
    var k=ind+1;
    var restr=customDate    //Всё в одну строку так же. 
    const errMsg='Ожидалось увидеть дату в формате Day.Month.Year, где каждое значение - число'
    /*while(k<words.length ){   //Всё в одну строку (тут именно до конца)
        restr=restr+words[k]+" " 
        k++
    }*/
    try {
    var splitted=restr.split(reg); 
    }catch(err)
    {throw errMsg}

    
    if(splitted.length>0)
    {
        splitted.forEach(el => {
            if(isNaN(+el))
                throw errMsg;
        });
        try{
            date.day=+splitted[0];
            date.month=+splitted[1];
            date.year=+splitted[2];
        }catch(err) //Если неверно указана дата
        {throw errMsg}

    }else{
        throw errMsg
    }
    return date;
}
module.exports.parseCustomTime=parseCustomTime;
module.exports.parseCustomDate=parseCustomDate;