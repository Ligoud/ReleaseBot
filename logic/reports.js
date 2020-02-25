const fs=require('fs')
const path = require('path');

class Report{
    constructor(cName){
        this.cName=cName
    }

    async attachFile(filePath, turnContext){    //Это все из офф доков взято. Я не особо понимаю эти танцы с бубнами
        const fileData = fs.readFileSync(path.join(__dirname, filePath));
        const connector = turnContext.adapter.createConnectorClient(turnContext.activity.serviceUrl);
        const conversationId = turnContext.activity.conversation.id;
        const response = await connector.conversations.uploadAttachment(conversationId, {
            name: 'xdd.md',
            originalBase64: fileData,
            type: 'text/markdown'
        });
    
        // Retrieve baseUri from ConnectorClient for... something.
        const baseUri = connector.baseUri;
        const attachmentUri = baseUri + (baseUri.endsWith('/') ? '' : '/') + `v3/attachments/${ encodeURI(response.id) }/views/original`;
        return {
            name: 'xdd.md',
            contentType: 'text/markdown',
            contentUrl: attachmentUri,
            content: {            
                fileType: "md",
              }
        };
    }
}

module.exports.Report=Report
//