//Вместо переменных окружения. С ними рофляна какая-то
//
const { ActivityHandler, MessageFactory } = require('botbuilder');
//Переменные окружения врубаем 
const dotenv = require('dotenv');
const path = require('path');
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });
//
//
const { Mongo } = require('./DataBase/mongo')
//Логику подключаю
const afk_logic = require('./logic/away_from_workplace');
const { Role } = require('./logic/addRole');
const { User } = require('./logic/registerUsers');
const { cabs } = require('./logic/reserv_cabinets');
const { Consumables } = require('./logic/consumables');
const { CustomMessages } = require('./logic/Messages');
const { Equipment } = require('./logic/equipment') 
//
//Подключаем космосклиент
//АктивитиХендлер провайдит все обработчики событий
class MyBot extends ActivityHandler {
    constructor() {
        super();


        var database = {};
        var container = {};
        let md = new Mongo(process.env.DATABASE);
        const reg1 = /ш[её]л|еха/, reg2 = /где|когда|куда/, reg3 = /пока/, reg4 = /брон/, reg5 = /удал|убер/, reg6 = /куп|добав|полож/, reg7 = /взял|брал/, reg8 =//
            this.onMessage(async (context, next) => {
                var text = context.activity.text.toLocaleLowerCase();
                var words = text.split(' ');

                //await context.sendActivity(`Вы сказали '${ text }'`);
                try {
                    //await context.sendActivity(words[0]+'!!')
                    if (words[0].search('ofmbot') != -1) {
                        words.shift()
                    }

                    if (text == 'give me nums') {            //Просто почекать
                        await context.sendActivity(JSON.stringify(context.activity));
                        await context.sendActivity(context.activity.from.name + "\n" + context.activity.from.id);
                    }
                    /* #region  Отметка об уходе */
                    else if (words[0].search(reg1) != -1) //Отметка об уходе                                                                                            
                    {
                        var afk = afk_logic.afk_logic(context, words); //Сам результат обрабоки
                        await md.add('away_from_workplace', afk)
                        await context.sendActivity('Запись добавлена');
                    }
                    /* #endregion */
                    /* #region  Получение информации о том, куда ушел работник */
                    else if (words[0].search(reg2) != -1) //Куда ушел чел
                    {
                        var query = afk_logic.who_afk(words); //Разбор вопроса и составление запроса
                        const afk_users = await md.read('away_from_workplace', query)
                        console.log(afk_users.length)


                        if (afk_users.length < 1)
                            await context.sendActivity('Этот человек не оставлял никакой информации.\n');
                        else {
                            let lastDate = new Date(afk_users[afk_users.length - 1].date), currDate = new Date()
                            if (lastDate.getDate() != currDate.getDate() || lastDate.getMonth() != currDate.getMonth())
                                await context.sendActivity('От этого человека нет информации за сегодняшний день.\n');
                            else {
                                await context.sendActivity('Последняя информация от него:\n');
                                let textResult = afk_logic.form_afk_info(afk_users[afk_users.length - 1]);
                                await context.sendActivity(textResult);
                            }
                        }
                    }
                    /* #endregion */
                    /* #region  Вывод информации о занятых кабинетах */
                    else if (words[0].search(reg3) != -1)   //Вывод информации о кабинетах занятых
                    {
                        let cbs = new cabs();
                        var customDate = ''; //Дата в сообщении (может и не быть)
                        const local_reg = /кабинет|комнат/
                        let curr_cab = '' //Название кабинета (для второй ветки)
                        //
                        let k = 2;
                        while (k != words.length && words[k - 1].search(local_reg) == -1) //Скипаю фразу до ключевого слова
                            k++;
                        //
                        if (k != words.length) {
                            if (words[1] == 'список')  //Покажи список забронированных кабинетов ... //Может понадобиться потом
                            { }
                            else if (words[1].search(reg4) != -1) //Покажи бронь кабинета ...
                            {
                                curr_cab = words[k];
                                k++;
                            }
                            customDate = words[k]; //Если это не дата врдуг - выбрости ошибку дальше
                        }

                        console.log('customdate in a bot', customDate)
                        console.log('currCab is ', curr_cab)
                        let resInfo = await cbs.show_reserved_list(customDate, context.activity.localTimestamp, curr_cab, '', md, 'cabinets');
                        await context.sendActivity(resInfo.resInfo);
                    }
                    /* #endregion */
                    /* #region  Бронирование кабинета */
                    else if (words[0].search(reg4) != -1) //Бронирование кабинета
                    {
                        //container = await client.database(process.env.DATABASE).containers.createIfNotExists({id:'cabinets'}) //
                        let cbs = new cabs();
                        //let ans=await cbs.add_reserv(container,words,context.activity.from.id,context.activity.localTimestamp);
                        let ans = await cbs.add_reserv(md, 'cabinets', words, context.activity.from.id, context.activity.localTimestamp);

                        await context.sendActivity(ans);
                    }
                    /* #endregion */
                    /* #region  Снятие брони с кабинета, оборудования и удаление из корзины */
                    else if (words[0].search(reg5) != -1)  //Удаляем бронь с кабинета и расходники из корзины
                    {
                        let cnsmbls = new Consumables();
                        let cbs = new cabs();
                        let answ = ''
                        if (words[1] === 'из') //убери ИЗ корзины ...
                            answ = await cnsmbls.parse_to_basket('remove', words, 3, md, 'basket_to_buy')  //3 т.к. после слова корзина
                        else    //Удаление брони с кабинета. тут уже разбирается парсер внутри модуля
                            answ = await cbs.remove_reserv(md, 'cabinets', words, 0, context.activity.localTimestamp, context.activity.from.id)

                        await context.sendActivity(answ);
                    }
                    /* #endregion */
                    /* #region  Добавить расходник в список возможных расходников */
                    else if (words[0].search(reg6) != -1) //Добавить консум
                    {

                        let cnsmbls = new Consumables();
                        let answ = ''
                        if (words[0].search('добав') != -1) {
                            if (words[1] == 'в') {   //Добавь В корзину ...                            
                                answ = cnsmbls.parse_to_basket('add', words, 3, md, 'basket_to_buy')  //3 т.к. после слова корзина
                            }
                            else
                                answ = await cnsmbls.change_consume('add', md, 'consumables', words, 1, 'basket_to_buy');
                        } else {
                            answ = await cnsmbls.change_consume('add', md, 'consumables', words, 1, 'basket_to_buy')
                        }

                        await context.sendActivity(answ);
                    }
                    /* #endregion */
                    /* #region  Изъятие расходников и оборудования */
                    else if (words[0].search(reg7) != -1)  //Забираю консум со склада. Взял ...
                    {
                        let localRegex=/верну|оставлю|будет/ //Верну в _время_ . Оставлю в _кабинет_ . Будет в _кабинет_ 
                        let sep=text.search(localRegex)
                        let answ=''
                        if(sep!=-1)    //Команда изъятия оборудования
                        {
                            let equip= new Equipment();
                            equip= await equip.get_equip(md,'equipment',words,localRegex)
                        }else{  //Расходники
                            let cnsmbls = new Consumables();
                            answ = await cnsmbls.change_consume('remove', md, 'consumables', words, 1, 'basket_to_buy');
                        }
                        await context.sendActivity(answ);
                    }
                    /* #endregion */
                    /* #region  Подсказки пользователю */
                    else if (words[0][0].search('/') != -1) //Подсказки по командам сюда
                    {
                        let key = words[0].slice(1);
                        let info = ''
                        const messgs = new CustomMessages();
                        if (key.search('help') != -1) {
                            let role = new Role();
                            //container  = await client.database(process.env.DATABASE).containers.createIfNotExists({ id: 'roles' });
                            let arr = await role.getRole(context.activity.from.name.toLocaleLowerCase(), md, 'roles');
                            //console.log(arr);
                            let btns_list = ['/h1', '/h2', '/h3', 'Ничего']
                            info += 'Бот распосзнает несколько типов команд. Чтобы получить информацию по формату ввода этих команд - введите:\n'
                            if (arr.includes('admin', 0)) {
                                btns_list.unshift('/h0')
                                info += '1) Команды добавления ролей - "/h0"\n'
                            }
                            info += '1) Команды отметки об уходе с рабочего места - "/h1"\n'
                            info += '1) Команды бронирования кабинета - "/h2"\n'
                            info += '1) Команды учета расходных материалов - "/h3"\n'

                            //Похоже, тимс не работает с кнопками :/
                            var btns = MessageFactory.suggestedActions(btns_list, info);
                            await context.sendActivity(btns);
                            //await context.sendActivity(info);
                        }
                        else if (key == 'bug') {
                            let itm = {
                                comment: text,
                                date: context.activity.localTimestamp
                            };
                            await md.add('review', itm);
                            await context.sendActivity('Запись добавлена')
                        }
                        else {
                            if (key.search('h1') != -1)
                                info = messgs.h1; //Потом вернуть
                            else if (key == 'h2')
                                info = messgs.h2;
                            else if (key == 'h3')
                                info = messgs.h3;
                            //else if(key=='h4')
                            //  info=messgs.h4

                            if (info != '')
                                await context.sendActivity(info);
                        }
                    }
                    /* #endregion */
                    else if (words[0].search('ничего') != -1) { } //Просто типа скипа
                    /* #region  Добавление роли */
                    else {  //Тут я решил почему то добавление роли как ендкейс сделать :/  типа "выдай роль такая-то тому-то" именно в таком порядке роль - название - пользователь
                        console.log('Проверка на ключевое слово "роль"')
                        let ind = 0;
                        while (words[ind] != 'роль' && ind != words.length)//Останавливается на роли
                            ind++;
                        if (ind != words.length) {
                            let role = new Role();
                            //container  = await client.database(process.env.DATABASE).containers.createIfNotExists({ id: 'roles' });
                            var check = role.addRole(words, ind, md, 'roles');
                            if (check)
                                await context.sendActivity('Роли были добавлены');
                        }
                        else
                            await context.sendActivity('Чтобы получить информацию о существующих командах - отправьте /help. \n Чтобы оставить сообщение о баге или некорректной работе команды - отправьте /bug <Описание проблемы>');
                    }
                    /* #endregion */
                }
                catch (err) {
                    await context.sendActivity(err);
                    console.log(err);
                }


                await next();
            });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Привет, юзер');
                    //Тут добавлять id в список пользователей надо (регистрация пользователя)
                    let user = new User();
                    user.userAdd(context.activity.from, md, 'users');
                }
            }

            await next();
        });
    }
}

module.exports.MyBot = MyBot;
