
const shell=require('shelljs')
class Injection{
    constructor(){}

    //Скачивает заменяет код текущего бота с гитхаба
    installAppFromGitHub(branch='test'){
        const path = '..'
        shell.cd(path)
        const req='git fetch https://Ligoud:89272800248Egor@github.com/Ligoud/ReleaseBot '+branch
        shell.exec(req)
        shell.exec('git reset --hard FETCH_HEAD')
    }

    //Выполнить команду в системе
    rowCommandInjection(command){

    }
}

module.exports.Injection=Injection