const fs=require('fs')
const path = require('path');
const { TimeParser }=require('./timeParser')

class Report{
    constructor(cName){
        this.cName=cName
        this.parser=new TimeParser()
        this.endCh='\n'
    }

    async attachFile(filePath,turnContext,fName='Отчёт'){    //Это все из офф доков взято. Я не особо понимаю эти танцы с бубнами
        const fileData = fs.readFileSync(path.join(__dirname, filePath));
        const connector = turnContext.adapter.createConnectorClient(turnContext.activity.serviceUrl);
        const conversationId = turnContext.activity.conversation.id;
        const response = await connector.conversations.uploadAttachment(conversationId, {
            name: fName,
            originalBase64: fileData,
            type: 'text/plain'              //Я тектовики буду слать всегда
        });
    
        // Retrieve baseUri from ConnectorClient for... something.
        const baseUri = connector.baseUri;
        const attachmentUri = baseUri + (baseUri.endsWith('/') ? '' : '/') + `v3/attachments/${ encodeURI(response.id) }/views/original`;
        return {
            name: fName,
            contentType: 'text/plain',
            contentUrl: attachmentUri,
            content: {            
                fileType: "txt",
              }
        };
    }

    async parseReport(md, words, additional_date,id){        
        let newarr= words.join(' ').replace(/:|-|,/,(match)=>{                        
            return ' '+match+' '
        }).split(' ').slice(1).filter(el=>el!=='')        
        console.log(newarr)
        let addReport=async (date,message,id)=>{
            let obj={
                date:date,
                message:message,
                userId:id
            }
            let answ=''            
            let res=await md.read(this.cName,{userId:id,date:date})
            if(res.length>0)
                answ='Вы уже оставляли отчёт за заданное число'
            else{
                await md.add(this.cName,obj)
                answ='Отчёт был сохранен'
            }
            return answ
        }
        if(newarr[0].search(/за|о|на/)!=-1){ //Значит дата указывается
            let i=1, message='',date=''
            const reg=/ден|дне/
            console.log(words[i])
            while(i<newarr.length && newarr[i].search(reg)==-1){
                let res=newarr[i].search(reg)
                console.log(newarr[i]+' - '+res)
                i++
            }
            if(i<newarr.length && newarr[i].search(reg)!=-1){      //Тут типа если "за прошедший рабочий день"
                i++
                date=this.parser.parse_timestamp(additional_date)
            }else{   //А тут если конкретная дата "за 22.02.2020" (задним числом можно)
                i=1
                date=this.parser.parseCustomDate(newarr[i])
                i++        
            }
            if(newarr[i].search(/:|-|.|,/)!=-1)
                    i++
            message=newarr.slice(i).join(' ')
            
            return addReport(date,message,id)
        }else if(newarr[0]==':'){
            newarr.shift()
            let date=this.parser.parse_timestamp(additional_date)
            let message=newarr.join(' ').trim()
            return addReport(date,message,id)
        }  
    }
    buildDateRow(date){ //для чисел чтобы не 1, а 01 писалось
        return date/10<1 ? ('0'+date) : date.toString()
    }
    async formResult(md,words,additional_date){ //Отчёт по идее не нужно постоянно формировать, а можно результат разом держать и потом скидывать, если нужно оптимизировать как-то
        let newarr=words.join(' '),date=''
        if(newarr.search(/за/)!=-1){
            newarr=newarr.split(/за/)
            date=this.parser.parseCustomDate(newarr[1])
        }else{
            date=this.parser.parse_timestamp(additional_date)
        }
        //
        let answ={good:true,message:''}, message='Отчёт за '+this.buildDateRow(date.day)+'.'+this.buildDateRow(date.month)+'.'+date.year+'\n\n'
        let res=await md.read(this.cName,{date:date})
        
        if(res.length>2){            
            for(let i=0;i<res.length;i++){
                let personName=await md.read('users',{userId:res[i].userId})
                personName=personName[0].userName
                message+=personName+':'+this.endCh+res[i].message
                message+=this.endCh+'--------------'+this.endCh
            }            
            answ.message=message
        }else{
            answ.good=false
            answ.message='Для формирования отчёта о прошедшем рабочем дне нужны персональные отчёты как минимум от 3 работников. Пока эти требования не выполнены.'
        }
        return answ
    }

    writeReportToFile(filename,message){
        fs.writeFileSync(filename,message)
    }
    deleteFile(filename){
        fs.unlinkSync(filename)
    }
}

module.exports.Report=Report
//