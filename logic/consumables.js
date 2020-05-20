

class Consumables {
    constructor() { }
    /* #region вспомогательные функции */

    async get_consume(md, cName, cons_name) //Получить результат по названию консума
    {
        const query = {
            consum_name: cons_name
        }
        //const {result: res}= await container.container.items.query(query).toArray();  //COSMOS
        const res = await md.read(cName, query)
        res.forEach(element => {    //Поч тут форич?? У меня же один консум читается. хммммм. пусть будет.
            element.consum_name = element.consum_name.trim()
        });
        return res;
    }
    custom_slice(str) {
        if (str[str.length - 1] == ',') //Удаляю последнюю запятую есил она не с пробелом
            str = str.slice(0, -1)
        else if (str[0] == ',')      //Или первую. И такие люди бывают
            str = str.slice(1)

        str = str.trim()

        return str;
    }
    //ХАХАХАХ Я НЕ ЗНАЮ ЧТО ЭТО. 
    //Кажется, из дефолтной строки Count Consume Получает эти пары. ОБЪЕКТ С ПАРАМИ - МАССИваМИ
    get_sets(words, ind) {
        let count = [], cons = []   //А это можно было объединить в обж сразу
        let cObj = {  //Можно было на 2 лета разбить
            consum_name: '',
            count: 0
        }
        //Разбор строки (может через запятую идти 2 пачки бумаги, 5 банок клея)
        while (ind != words.length) //До конца указывают товары
        {
            if (!Number.isNaN(+words[ind])) {
                cObj.count = +words[ind]
                ind++
            } else{
                cObj.count = 1
                //throw 'Неверный формат. Ожидалось увидеть Count (' + words[ind] + ')'
            }
            cObj.consum_name = ''
            while (ind != words.length && words[ind - 1][words[ind - 1].length - 1] != ',' && words[ind][0] != ',' && words[ind] != ',') //Для перечисления  ?*********************************
            {
                cObj.consum_name += ' ' + words[ind]
                ind++;
            }
            cObj.consum_name = this.custom_slice(cObj.consum_name);
            //cObj.consum_name=this.normalize_consum_name(cObj.consum_name)   // < ---- Normalized
            count.push(cObj.count)
            cons.push(cObj.consum_name)
        }
        let res = {
            count: count,
            cons: cons
        }
        return res;
    }
    //Инициализируем библиотеку AZ.Morph
    async initAZlibrary(){
        let az=require('az')
        let prom=new Promise((resolve,reject)=>{
            az.Morph.init(()=>{
                console.log('DAWG loaded')
                resolve()
            })
        })
        await prom
        this.morph=az.Morph
    }
    //Возвращает название консума в именительном падеже (каждое слово)
    normalize_consum_name(name){    //name - имя расходника в тч из нескольких слов состоящее
        //console.log('NORMALIZING ',name)
        
        name=name.split(' ')
        let normWord=[]
        name.forEach(el=>{
            let parse=this.morph(el,{typos:'auto'})[0]
            let nw=parse.normalize(true).word
            normWord.push(nw)
            //console.log(parse.tag.CAse)
            //console.log(nw,' - ',parse.inflect(parse.tag).word)
        })
        normWord=normWord.join(' ').trim()
        
        //console.log('normalized row ',normWord)
        return normWord                
    }   
    async change_busket(action, md, cName, name, count) //Доавляем/удаляем из корзины
    {
        let addObj = {
            consum_name: name,
            count: count
        }
        let returnAnsw = ''
        let res = await this.get_consume(md, cName, name)   //Запрос к бд для добавляемого итема
        if (action == 'add')
            if (res.length != 0) {
                await md.update(cName, { _id: res[0]._id }, { $set: { count: res[0].count + addObj.count } })
            } else
                await md.add(cName, addObj)
        else if (action == 'remove') {
            if (res.length == 0)
                returnAnsw = '\nЗаписи о расходнике ' + name + ' нет в корзине.'
            else {
                await md.delete(cName, { _id: res[0]._id })
            }
        }
        return returnAnsw
    }
    /* #endregion */
    /* #region основной функциОНАЛ */   

 
    //Начиная с названия первого консума подается сюда строка. через запятую можно
    //Вызывает когда удаляют из корзины или добавляют в нее прямым текстом.
    parse_to_basket(action, words, ind, md, cName)//Парсим строку и обновляем корзину
    {
        const reg = /,|\./
        let retrn = 'Введены некорректные данные. Поробуйте команду /help для получения дополнительной информации.'
        if(ind<words.length){
            let spl=words.slice(ind).join(' ').split(reg)
            spl.forEach(el=>{
                let pairConsumeCount=el.split(' ')
                let count=0                
                if(!Number.isNaN(+pairConsumeCount[pairConsumeCount.length-1])){
                    count=+pairConsumeCount.pop()//Забираю каунт, раз уж он есть                    
                }
                let consume=pairConsumeCount.join(' ')//джойню полное название консума                    
                consume = this.custom_slice(consume)
          
                if (consume.search(reg) == -1) {    //Зачем тут эта проверка?!?!? Тупо буферная защита            
                    if (action == 'add')
                        this.change_busket(action, md, cName, consume, count)
                    else if (action == 'remove')
                        retrn += this.change_busket(action, md, cName, consume, count)
                    retrn = 'Записи обновлены.'
                }
            })
        }
        
        return retrn
    }
    async getBasketList(cName,md){
        let basketList= await md.read(cName,{})
        let result='Пока нет товаро для покупки.'
        if(basketList.length>0){
            result='Список товаров, которые нужно купить:\n'
            basketList.forEach(el=>{
                result+=' 1) '+el.consum_name
                if(el.count>0)
                    result+=' ('+el.count+' шт.)'
                result+='\n'
            })
        }
        return result
    }
    //Добавь 13 Ручка (дада очень смещно)
    //название странное. но менять не буду.
    async change_consume(action, md, cName, words, ind, optional_container = '') //container - куда записываем, words - это текст юзера по словам разбитый, 
    //ind - позиция, с которой продолжать парсинг words, optional_container - корзина           
    {
        await this.initAZlibrary()
        //
        let delteFromBasketInCaseWeNeedIt=async (consume,count)=>{
            const btb='basket_to_buy'
            let basktCons=await this.get_consume(md,btb,consume)
            //console.log(basktCons)
            if(basktCons.length>0 && basktCons[0].count<=count){
                await this.change_busket('remove',md,btb,consume,0)
            }
        }

        let count = [], cons = []
        let cObj = {  //Просто объект для пуша в бд
            consum_name: '',
            count: 0
        }
        const res = this.get_sets(words, ind);
        count = res.count;
        cons = res.cons;
        let returnAnswer = 'Записи обновлены.'
        //
        //console.log(optional_container)
        //console.info(cons.toString())

        if (count.length != cons.length)
            throw 'Коамнда добавления расходников неправильно составлена.Введите /help для просмотра подробной информации'
        else {
            for (let i = 0; i < count.length; i++) {
                cons[i]=this.normalize_consum_name(cons[i])
                let res = await this.get_consume(md, cName, cons[i])
                if (res.length == 0) {  //Если нет записей еще
                    if (action == 'add') {
                        cObj.consum_name = cons[i]
                        cObj.count = count[i]
                        
                        await md.add(cName, cObj)
                        await delteFromBasketInCaseWeNeedIt(cObj.consum_name,cObj.count)
                    } else if (action == 'remove') {
                        if (cons.length == 1)
                            returnAnswer = 'О расходнике "' + cons[i] + '" не было найдено записей.'
                        else
                            returnAnswer += '\nО расходнике "' + cons[i] + '" не было найдено записей.\n'
                        cObj.consum_name = cons[i]
                        cObj.count = 0
                        
                        await md.add(cName, cObj)
                    }
                } else {    //Если записи уже есть
                    let result = await md.read(cName, { _id: res[0]._id })
                    let maBody = res[0]
                    //console.log(maBody);
                    if (action == 'add'){
                        maBody.count += count[i]
                        //UPDATE basket in case we need it
                        await delteFromBasketInCaseWeNeedIt(maBody.consum_name,count[i])
                    }
                    else if (action == 'remove') {
                        if (maBody.count == 0)
                            returnAnswer += '\nСудя по всему расходника "' + maBody.consum_name + '" нет в наличии либо не обновлены данные о нем\n'
                        else {
                            maBody.count -= count[i]
                            if (maBody.count <= 0) {
                                returnAnswer += '\nРасходник "' + maBody.consum_name + '" был добавлен в список товаров к покупке (закончились на складе)'
                                await this.change_busket('add', md, optional_container, maBody.consum_name, 0)
                            }
                        }
                    }
                    //console.log('THERE IS A HUGE PROBLEm')
                    await md.replace(cName, { _id: res[0]._id }, maBody);
                }
            }
        }
        return returnAnswer
    }
    /* #endregion */
}

//var cons=new Consumables()

//cons.normalize_consum_name('гелевые ручки')
//console.info(az.Morph)
module.exports.Consumables = Consumables;